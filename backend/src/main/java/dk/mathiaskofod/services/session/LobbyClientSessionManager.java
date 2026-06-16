package dk.mathiaskofod.services.session;

import dk.mathiaskofod.services.auth.models.TokenInfo;
import dk.mathiaskofod.services.lobby.models.LobbyParticipant;
import dk.mathiaskofod.services.session.actions.lobby.client.KickParticipantAction;
import dk.mathiaskofod.services.session.actions.lobby.client.LobbyClientAction;
import dk.mathiaskofod.services.session.envelopes.LobbyClientActionEnvelope;
import dk.mathiaskofod.services.session.envelopes.LobbyClientEventEnvelope;
import dk.mathiaskofod.services.session.envelopes.WebsocketEnvelope;
import dk.mathiaskofod.services.session.events.lobby.client.ParticipantKickedEvent;
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
        log.info("Registering new client connected with websocket connection id: {}", websocketConnectionId);
        sessionRegistry.setConnectionId(tokenInfo.getGameId(), websocketConnectionId);
    }

    @Override
    public void onConnectionClosed(TokenInfo tokenInfo, CloseReason closeReason) {

        log.info("Leader abandoned lobby: {}", tokenInfo.getGameId());

        lobbyService.markLobbyAbandoned(tokenInfo.getGameId());

        CloseReason participantCloseReason =
                new CloseReason(CustomWebsocketCodes.LOBBY_LEADER_LEFT.getCode(), "Leader left the lobby");
        lobbyService.getLobby(tokenInfo.getGameId()).getParticipants().stream()
                .map(LobbyParticipant::id)
                .forEach(playerId -> disconnectParticipant(playerId, participantCloseReason));
    }

    @Override
    public void onMessage(TokenInfo tokenInfo, WebsocketEnvelope<?> message) {

        if (!(message instanceof LobbyClientActionEnvelope(LobbyClientAction action))) {
            throw new UnknownCategoryException("Invalid envelope type for lobby client action", 400);
        }

        switch (action) {
            case KickParticipantAction(String participantId, String kickReason) -> {
                ParticipantKickedEvent event = new ParticipantKickedEvent(participantId, kickReason);

                disconnectParticipant(
                        participantId, new CloseReason(CustomWebsocketCodes.KICKED.getCode(), kickReason));
                broadcastToLobby(tokenInfo.getGameId(), new LobbyClientEventEnvelope(event));
            }
            default ->
                log.warn(
                        "Received unknown action from lobby client with player id: {}. Action: {}",
                        tokenInfo.getPlayerId(),
                        action);
        }
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
