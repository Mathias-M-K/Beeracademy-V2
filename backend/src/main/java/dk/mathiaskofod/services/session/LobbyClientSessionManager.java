package dk.mathiaskofod.services.session;

import dk.mathiaskofod.api.lobby.models.dto.LobbyDTO;
import dk.mathiaskofod.api.lobby.models.dto.LobbyParticipantDTO;
import dk.mathiaskofod.services.auth.models.TokenInfo;
import dk.mathiaskofod.services.game.id.generator.IdGenerator;
import dk.mathiaskofod.services.lobby.models.Emoji;
import dk.mathiaskofod.services.lobby.models.LobbyParticipant;
import dk.mathiaskofod.services.session.actions.lobby.client.*;
import dk.mathiaskofod.services.session.actions.lobby.common.SendEmojiAction;
import dk.mathiaskofod.services.session.actions.lobby.common.SendMessageAction;
import dk.mathiaskofod.services.session.actions.lobby.common.UpdateSettingsAction;
import dk.mathiaskofod.services.session.envelopes.LobbyClientActionEnvelope;
import dk.mathiaskofod.services.session.envelopes.LobbyClientEventEnvelope;
import dk.mathiaskofod.services.session.envelopes.WebsocketEnvelope;
import dk.mathiaskofod.services.session.events.lobby.client.GameStartedEvent;
import dk.mathiaskofod.services.session.events.lobby.client.ParticipantRemovedEvent;
import dk.mathiaskofod.services.session.events.lobby.client.ParticipantsRearrangedEvent;
import dk.mathiaskofod.services.session.events.lobby.common.EmojiSentEvent;
import dk.mathiaskofod.services.session.events.lobby.common.MessageSentEvent;
import dk.mathiaskofod.services.session.events.lobby.participant.NewParticipantEvent;
import dk.mathiaskofod.services.session.exceptions.CannotIdentifyPlayer;
import dk.mathiaskofod.services.session.exceptions.SessionNotFoundException;
import dk.mathiaskofod.services.session.exceptions.UnknownCategoryException;
import dk.mathiaskofod.websocket.game.models.WebsocketCodes;
import io.quarkus.websockets.next.CloseReason;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@ApplicationScoped
public class LobbyClientSessionManager extends AbstractLobbySessionManager {

    @Override
    public void onNewConnection(String websocketConnectionId, TokenInfo tokenInfo) {
        String lobbyId = tokenInfo.getGameId();
        log.info("Registering new lobby client connected with websocket connection id: {}", websocketConnectionId);
        sessionRegistry.setConnectionId(lobbyId, websocketConnectionId);

        confirmHandshake(tokenInfo, LobbyClientEventEnvelope::new);
        provideLobbySnapshotToClient(tokenInfo, LobbyClientEventEnvelope::new);
        provideIdentityToClient(tokenInfo, LobbyClientEventEnvelope::new);
    }

    // TODO could probably also benefit from strategy pattern
    @Override
    public void onConnectionClosed(TokenInfo tokenInfo, CloseReason closeReason) {

        String lobbyId = tokenInfo.getGameId();

        log.info(
                "Leader abandoned lobby: {}, with reason: {}-{}",
                lobbyId,
                closeReason.getCode(),
                closeReason.getMessage());

        boolean isTransitioning = closeReason.getCode() == WebsocketCodes.TRANSITIONING.getCode();

        CloseReason participantCloseReason;
        if (isTransitioning) {
            lobbyService.markLobbyAsTransitioning(lobbyId);
            sessionRegistry.clearConnectionId(lobbyId);
            participantCloseReason = new CloseReason(WebsocketCodes.TRANSITIONING.getCode());
        } else {
            lobbyService.markLobbyAsAbandoned(lobbyId);
            participantCloseReason =
                    new CloseReason(WebsocketCodes.LOBBY_LEADER_LEFT.getCode(), "Leader left the lobby");
        }

        lobbyService.getLobby(lobbyId).getParticipants().stream()
                .filter(LobbyParticipant::isActive)
                .map(LobbyParticipant::getId)
                .forEach(playerId -> disconnectParticipant(playerId, participantCloseReason));
    }

    // TODO can probably utilize strategy pattern
    @Override
    public void onMessage(TokenInfo tokenInfo, WebsocketEnvelope<?> message) {

        String lobbyId = tokenInfo.getGameId();

        if (!(message instanceof LobbyClientActionEnvelope(LobbyClientAction action))) {
            throw new UnknownCategoryException("Invalid envelope type for lobby client action", 400);
        }

        switch (action) {
            case AddParticipantAction(String participantName) -> {
                String participantId = IdGenerator.generatePlayerId();
                LobbyParticipant newParticipant =
                        lobbyService.registerParticipant(lobbyId, participantName, participantId, false);

                NewParticipantEvent event =
                        new NewParticipantEvent(LobbyParticipantDTO.fromLobbyParticipant(newParticipant));
                broadcastToLobby(lobbyId, new LobbyClientEventEnvelope(event));
            }
            case RemoveParticipantAction(String participantId) -> {
                ParticipantRemovedEvent event = new ParticipantRemovedEvent(participantId);

                try {
                    CloseReason closeReason = new CloseReason(WebsocketCodes.KICKED.getCode());
                    disconnectParticipant(participantId, closeReason);
                } catch (SessionNotFoundException snf) {
                    log.info("Participant: {}, is not active. Proceeding to remove from lobby", participantId);
                    lobbyService.removeDisconnectedParticipant(lobbyId, participantId);
                }

                broadcastToLobby(lobbyId, new LobbyClientEventEnvelope(event));
            }
            case StartGameAction() -> {
                lobbyService.createGame(lobbyId);
                broadcastToLobby(lobbyId, new LobbyClientEventEnvelope(new GameStartedEvent()));
                transitionToGameWebsocket(lobbyId);
            }
            case UpdateSettingsAction updateSettingsAction -> {
                String participantId = updateSettingsAction
                        .getBehalfOf()
                        .orElseThrow(() -> new CannotIdentifyPlayer(
                                "No participantId was provided when attempting to change settings", 400));

                applyAndBroadcastSettings(lobbyId, participantId, updateSettingsAction);
            }
            case SendEmojiAction(Emoji emoji) -> {
                EmojiSentEvent event = new EmojiSentEvent(lobbyId, emoji);
                broadcastToLobby(lobbyId, new LobbyClientEventEnvelope(event), List.of(lobbyId));
            }
            case SendMessageAction(String clientMessage) -> {
                MessageSentEvent event = new MessageSentEvent(lobbyId, clientMessage);
                broadcastToLobby(lobbyId, new LobbyClientEventEnvelope(event), List.of(lobbyId));
            }
            case RearrangeParticipantsAction(List<RearrangeParticipantsAction.ParticipantPosition> positions) -> {
                log.info("Rearranging participants for lobby {}", lobbyId);
                positions.forEach(participantPosition -> this.lobbyService.changeParticipantPosition(
                        lobbyId, participantPosition.participantId(), participantPosition.newPosition()));

                List<LobbyParticipantDTO> participants =
                        LobbyDTO.fromLobby(lobbyService.getLobby(lobbyId)).participants();
                ParticipantsRearrangedEvent event = new ParticipantsRearrangedEvent(participants);
                broadcastToLobby(lobbyId, new LobbyClientEventEnvelope(event));
            }
            default ->
                log.warn(
                        "Received unknown action from lobby client with player id: {}. Action: {}",
                        tokenInfo.getPlayerId(),
                        action);
        }
    }

    private void transitionToGameWebsocket(String lobbyId) {
        CloseReason reason = new CloseReason(WebsocketCodes.TRANSITIONING.getCode());
        getWebsocketConnection(lobbyId).closeAndAwait(reason);
    }

    private void disconnectParticipant(String participantId, CloseReason reason) {
        log.info(
                "Closing connection for participant: {}, with reason: {}-{}",
                participantId,
                reason.getCode(),
                reason.getMessage());
        getWebsocketConnection(participantId).closeAndAwait(reason);
    }
}
