package dk.mathiaskofod.services.session;

import dk.mathiaskofod.services.auth.models.TokenInfo;
import dk.mathiaskofod.services.lobby.models.Emoji;
import dk.mathiaskofod.services.lobby.models.LobbyParticipant;
import dk.mathiaskofod.services.session.actions.lobby.participant.LobbyParticipantAction;
import dk.mathiaskofod.services.session.actions.lobby.participant.SendEmojiAction;
import dk.mathiaskofod.services.session.actions.lobby.participant.SendMessageAction;
import dk.mathiaskofod.services.session.envelopes.LobbyParticipantActionEnvelope;
import dk.mathiaskofod.services.session.envelopes.LobbyParticipantEventEnvelope;
import dk.mathiaskofod.services.session.envelopes.WebsocketEnvelope;
import dk.mathiaskofod.services.session.events.lobby.participant.*;
import dk.mathiaskofod.services.session.exceptions.UnknownCategoryException;
import dk.mathiaskofod.services.session.repository.Session;
import dk.mathiaskofod.websocket.game.models.CustomWebsocketCodes;
import io.quarkus.websockets.next.CloseReason;
import jakarta.enterprise.context.ApplicationScoped;
import lombok.extern.slf4j.Slf4j;

@ApplicationScoped
@Slf4j
public class LobbyParticipantSessionManager extends AbstractLobbySessionManager {

    @Override
    public void onNewConnection(String websocketConnectionId, TokenInfo tokenInfo) {
        log.info(
                "New participant connected! Name: {}, Player id: {}, Game id: {}, WebsocketId:{}",
                tokenInfo.getName(),
                tokenInfo.getPlayerId(),
                tokenInfo.getGameId(),
                websocketConnectionId);
        LobbyParticipant lobbyParticipant = lobbyService.registerConnectedParticipant(
                tokenInfo.getGameId(), tokenInfo.getName(), tokenInfo.getPlayerId());

        Session participantSession = new Session(tokenInfo.getPlayerId(), websocketConnectionId);
        sessionRegistry.registerSession(participantSession);

        LobbyParticipantConnectedEvent event = new LobbyParticipantConnectedEvent(lobbyParticipant);
        LobbyParticipantEventEnvelope envelope = new LobbyParticipantEventEnvelope(event);

        broadcastToLobby(tokenInfo.getGameId(), envelope);
    }

    @Override
    public void onConnectionClosed(TokenInfo tokenInfo, CloseReason closeReason) {

        log.info(
                "Lobby participant left. Name: {}, ParticipantID: {}, CloseReason: {}-{}",
                tokenInfo.getName(),
                tokenInfo.getPlayerId(),
                closeReason.getCode(),
                closeReason.getMessage());

        LobbyParticipant leavingParticipant =
                lobbyService.getLobby(tokenInfo.getGameId()).getParticipant(tokenInfo.getPlayerId());
        lobbyService.removeDisconnectedParticipant(tokenInfo.getGameId(), tokenInfo.getPlayerId());
        sessionRegistry.removeSession(tokenInfo.getPlayerId());

        LobbyParticipantDisconnectedEvent event = new LobbyParticipantDisconnectedEvent(leavingParticipant);
        LobbyParticipantEventEnvelope envelope = new LobbyParticipantEventEnvelope(event);

        if (closeReason.getCode() == CustomWebsocketCodes.LOBBY_LEADER_LEFT.getCode()) {
            // Skipping broadcast, since every member have already been notified
            return;
        }
        broadcastToLobby(tokenInfo.getGameId(), envelope);
    }

    @Override
    public void onMessage(TokenInfo tokenInfo, WebsocketEnvelope<?> message) {

        if (!(message instanceof LobbyParticipantActionEnvelope(LobbyParticipantAction action))) {
            throw new UnknownCategoryException("Invalid envelope type for lobby participant action", 400);
        }

        switch (action) {
            case SendEmojiAction(Emoji emoji) -> {
                EmojiSentEvent event = new EmojiSentEvent(tokenInfo.getPlayerId(), emoji);
                broadcastToLobby(tokenInfo.getGameId(), new LobbyParticipantEventEnvelope(event));
            }
            case SendMessageAction(String clientMessage) -> {
                MessageSentEvent event = new MessageSentEvent(tokenInfo.getPlayerId(), clientMessage);
                broadcastToLobby(tokenInfo.getGameId(), new LobbyParticipantEventEnvelope(event));
            }
            default ->
                log.warn(
                        "Received unknown action from lobby participant with player id: {}. Action: {}",
                        tokenInfo.getPlayerId(),
                        action);
        }
    }
}
