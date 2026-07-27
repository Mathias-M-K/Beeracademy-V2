package dk.mathiaskofod.services.session;

import dk.mathiaskofod.api.lobby.models.dto.LobbyParticipantDTO;
import dk.mathiaskofod.services.auth.models.TokenInfo;
import dk.mathiaskofod.services.lobby.models.Emoji;
import dk.mathiaskofod.services.lobby.models.LobbyParticipant;
import dk.mathiaskofod.services.session.actions.lobby.common.SendEmojiAction;
import dk.mathiaskofod.services.session.actions.lobby.common.SendMessageAction;
import dk.mathiaskofod.services.session.actions.lobby.common.UpdateSettingsAction;
import dk.mathiaskofod.services.session.actions.lobby.participant.LobbyParticipantAction;
import dk.mathiaskofod.services.session.envelopes.LobbyParticipantActionEnvelope;
import dk.mathiaskofod.services.session.envelopes.LobbyParticipantEventEnvelope;
import dk.mathiaskofod.services.session.envelopes.WebsocketEnvelope;
import dk.mathiaskofod.services.session.events.lobby.common.EmojiSentEvent;
import dk.mathiaskofod.services.session.events.lobby.common.MessageSentEvent;
import dk.mathiaskofod.services.session.events.lobby.participant.*;
import dk.mathiaskofod.services.session.exceptions.UnknownCategoryException;
import dk.mathiaskofod.services.session.repository.Session;
import dk.mathiaskofod.websocket.game.models.CustomWebsocketCodes;
import io.quarkus.websockets.next.CloseReason;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;
import lombok.extern.slf4j.Slf4j;

@ApplicationScoped
@Slf4j
public class LobbyParticipantSessionManager extends AbstractLobbySessionManager {

    // TODO participant session manger uses session registry directly, while client session manager doesn't
    @Override
    public void onNewConnection(String websocketConnectionId, TokenInfo tokenInfo) {
        String lobbyId = tokenInfo.getGameId();
        String participantId = tokenInfo.getPlayerId();
        log.info(
                "New participant connected! Name: {}, Player id: {}, Game id: {}, WebsocketId:{}",
                tokenInfo.getName(),
                participantId,
                lobbyId,
                websocketConnectionId);

        LobbyParticipant lobbyParticipant =
                lobbyService.registerParticipant(lobbyId, tokenInfo.getName(), participantId, true);

        Session participantSession = new Session(participantId, websocketConnectionId);
        sessionRegistry.registerSession(participantSession);

        NewParticipantEvent event = new NewParticipantEvent(LobbyParticipantDTO.fromLobbyParticipant(lobbyParticipant));
        broadcastToLobby(lobbyId, new LobbyParticipantEventEnvelope(event));

        provideLobbySnapshotToClient(tokenInfo, LobbyParticipantEventEnvelope::new);
        provideIdentityToClient(tokenInfo, LobbyParticipantEventEnvelope::new);
    }

    @Override
    public void onConnectionClosed(TokenInfo tokenInfo, CloseReason closeReason) {

        String lobbyId = tokenInfo.getGameId();
        String playerId = tokenInfo.getPlayerId();

        log.info(
                "Lobby participant left. Name: {}, ParticipantID: {}, CloseReason: {}-{}",
                tokenInfo.getName(),
                playerId,
                closeReason.getCode(),
                closeReason.getMessage());

        /*
        TODO we can possibly remove the markAsAbandoned() stuff from Lobby. Just don't use the LobbyService when
         disconnecting or fail gracefully when fetching a Lobby
         */

        lobbyService.removeDisconnectedParticipant(lobbyId, playerId);

        boolean isTransitioning = CustomWebsocketCodes.TRANSITIONING.getCode() == closeReason.getCode();
        if (isTransitioning) {
            sessionRegistry.clearConnectionId(playerId);
        } else {
            sessionRegistry.removeSession(playerId);
        }

        LobbyParticipantDisconnectedEvent event = new LobbyParticipantDisconnectedEvent(playerId);
        LobbyParticipantEventEnvelope envelope = new LobbyParticipantEventEnvelope(event);

        if (closeReason.getCode() == CustomWebsocketCodes.LOBBY_LEADER_LEFT.getCode()
                || closeReason.getCode() == CustomWebsocketCodes.TRANSITIONING.getCode()) {
            // Skipping broadcast, since every member have already been notified
            return;
        }
        broadcastToLobby(lobbyId, envelope);
    }

    @Override
    public void onMessage(TokenInfo tokenInfo, WebsocketEnvelope<?> message) {

        String lobbyId = tokenInfo.getGameId();
        String playerId = tokenInfo.getPlayerId();

        if (!(message instanceof LobbyParticipantActionEnvelope(LobbyParticipantAction action))) {
            throw new UnknownCategoryException("Invalid envelope type for lobby participant action", 400);
        }

        switch (action) {
            case SendEmojiAction(Emoji emoji) -> {
                EmojiSentEvent event = new EmojiSentEvent(playerId, emoji);
                broadcastToLobby(lobbyId, new LobbyParticipantEventEnvelope(event), List.of(playerId));
            }
            case SendMessageAction(String clientMessage) -> {
                MessageSentEvent event = new MessageSentEvent(playerId, clientMessage);
                broadcastToLobby(lobbyId, new LobbyParticipantEventEnvelope(event), List.of(playerId));
            }
            case UpdateSettingsAction updateSettingsAction ->
                applyAndBroadcastSettings(lobbyId, playerId, updateSettingsAction);
            default ->
                log.warn(
                        "Received unknown action from lobby participant with player id: {}. Action: {}",
                        playerId,
                        action);
        }
    }
}
