package dk.mathiaskofod.services.session;

import dk.mathiaskofod.api.lobby.models.dto.LobbyDTO;
import dk.mathiaskofod.services.auth.models.Role;
import dk.mathiaskofod.services.auth.models.TokenInfo;
import dk.mathiaskofod.services.game.id.generator.IdGenerator;
import dk.mathiaskofod.services.lobby.models.LobbyParticipant;
import dk.mathiaskofod.services.session.actions.lobby.client.AddParticipantAction;
import dk.mathiaskofod.services.session.actions.lobby.client.KickParticipantAction;
import dk.mathiaskofod.services.session.actions.lobby.client.LobbyClientAction;
import dk.mathiaskofod.services.session.actions.lobby.client.StartGameAction;
import dk.mathiaskofod.services.session.actions.lobby.common.UpdateSettingsAction;
import dk.mathiaskofod.services.session.envelopes.LobbyClientActionEnvelope;
import dk.mathiaskofod.services.session.envelopes.LobbyClientEventEnvelope;
import dk.mathiaskofod.services.session.envelopes.WebsocketEnvelope;
import dk.mathiaskofod.services.session.events.lobby.client.GameStartedEvent;
import dk.mathiaskofod.services.session.events.lobby.client.ParticipantKickedEvent;
import dk.mathiaskofod.services.session.events.lobby.common.LobbyRoleEvent;
import dk.mathiaskofod.services.session.events.lobby.common.LobbySnapshotEvent;
import dk.mathiaskofod.services.session.events.lobby.participant.NewParticipantEvent;
import dk.mathiaskofod.services.session.exceptions.CannotIdentifyPlayer;
import dk.mathiaskofod.services.session.exceptions.SessionNotFoundException;
import dk.mathiaskofod.services.session.exceptions.UnknownCategoryException;
import dk.mathiaskofod.websocket.game.models.CustomWebsocketCodes;
import io.quarkus.websockets.next.CloseReason;
import jakarta.enterprise.context.ApplicationScoped;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@ApplicationScoped
public class LobbyClientSessionManager extends AbstractLobbySessionManager {

    @Override
    public void onNewConnection(String websocketConnectionId, TokenInfo tokenInfo) {
        String lobbyId = tokenInfo.getGameId();
        log.info("Registering new client connected with websocket connection id: {}", websocketConnectionId);
        sessionRegistry.setConnectionId(lobbyId, websocketConnectionId);

        LobbyDTO lobbyState = LobbyDTO.fromLobby(lobbyService.getLobby(lobbyId));
        LobbySnapshotEvent lobbySnapshotEvent = new LobbySnapshotEvent(lobbyState);
        sendMessage(lobbyId, new LobbyClientEventEnvelope(lobbySnapshotEvent));

        LobbyRoleEvent roleEvent = new LobbyRoleEvent(tokenInfo.getRole());
        sendMessage(lobbyId, new LobbyClientEventEnvelope(roleEvent));
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

        boolean isTransitioning = closeReason.getCode() == CustomWebsocketCodes.TRANSITIONING.getCode();

        CloseReason participantCloseReason;
        if (isTransitioning) {
            lobbyService.markLobbyAsTransitioning(lobbyId);
            participantCloseReason = new CloseReason(CustomWebsocketCodes.TRANSITIONING.getCode());
        } else {
            lobbyService.markLobbyAsAbandoned(lobbyId);
            participantCloseReason =
                    new CloseReason(CustomWebsocketCodes.LOBBY_LEADER_LEFT.getCode(), "Leader left the lobby");
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

                NewParticipantEvent event = new NewParticipantEvent(newParticipant);
                broadcastToLobby(lobbyId, new LobbyClientEventEnvelope(event));
            }
            case KickParticipantAction(String participantId, String kickReason) -> {
                ParticipantKickedEvent event = new ParticipantKickedEvent(participantId, kickReason);

                try {
                    CloseReason closeReason = new CloseReason(CustomWebsocketCodes.KICKED.getCode(), kickReason);
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
            default ->
                log.warn(
                        "Received unknown action from lobby client with player id: {}. Action: {}",
                        tokenInfo.getPlayerId(),
                        action);
        }
    }

    private void transitionToGameWebsocket(String lobbyId) {
        CloseReason reason = new CloseReason(CustomWebsocketCodes.TRANSITIONING.getCode());
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
