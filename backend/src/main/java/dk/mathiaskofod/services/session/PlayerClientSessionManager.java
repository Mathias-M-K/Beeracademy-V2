package dk.mathiaskofod.services.session;

import dk.mathiaskofod.services.event.publisher.SseEventPublisher;
import dk.mathiaskofod.domain.game.exceptions.GameException;
import dk.mathiaskofod.providers.exceptions.BaseException;
import dk.mathiaskofod.services.auth.models.TokenInfo;
import dk.mathiaskofod.services.event.publisher.models.ConnectionEvent;
import dk.mathiaskofod.services.game.exceptions.GameNotFoundException;
import dk.mathiaskofod.services.session.actions.game.common.DrawCardAction;
import dk.mathiaskofod.services.session.actions.game.player.PlayerClientAction;
import dk.mathiaskofod.services.session.actions.game.player.RelinquishPlayerAction;
import dk.mathiaskofod.services.session.envelopes.PlayerClientActionEnvelope;
import dk.mathiaskofod.services.session.envelopes.PlayerClientEventEnvelope;
import dk.mathiaskofod.services.session.envelopes.WebsocketEnvelope;
import dk.mathiaskofod.services.session.events.game.playerclient.PlayerConnectedEvent;
import dk.mathiaskofod.services.session.events.game.playerclient.PlayerDisconnectedEvent;
import dk.mathiaskofod.services.session.events.game.playerclient.PlayerRelinquishedEvent;
import dk.mathiaskofod.services.session.exceptions.SessionNotFoundException;
import dk.mathiaskofod.services.session.exceptions.UnknownCategoryException;
import io.quarkus.websockets.next.CloseReason;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@ApplicationScoped
public class PlayerClientSessionManager extends AbstractGameSessionManager {

    @Inject
    SseEventPublisher sseEventPublisher;

    public void onNewConnection(String websocketConnectionId, TokenInfo tokenInfo) {

        String partyId = tokenInfo.getPartyId();
        String playerId = tokenInfo.getPlayerId();

        if (!gameService.gameExists(partyId)) {
            throw new GameNotFoundException(partyId);
        }

        sessionRegistry.setConnectionId(playerId, websocketConnectionId);

        confirmHandshake(tokenInfo, PlayerClientEventEnvelope::new);
        PlayerConnectedEvent event = new PlayerConnectedEvent(playerId, partyId);
        broadcastToParty(partyId, new PlayerClientEventEnvelope(event));

        provideGameSnapshotToClient(tokenInfo, PlayerClientEventEnvelope::new);
        provideIdentityToClient(tokenInfo, PlayerClientEventEnvelope::new);

        sseEventPublisher.publishNewConnectionEvent(partyId, playerId, ConnectionEvent.CONNECTED);

        log.info(
                "Websocket Connection: Type:New player connection, PlayerID:{}, PartyID:{}, WebsocketConnID:{}",
                playerId,
                partyId,
                websocketConnectionId);
    }

    public void onConnectionClosed(TokenInfo tokenInfo, CloseReason closeReason) {

        String partyId = tokenInfo.getPartyId();
        String playerId = tokenInfo.getPlayerId();

        sessionRegistry.clearConnectionId(playerId);

        // The game session can already be gone — e.g. the connection was rejected with GAME_NOT_FOUND, which
        // closes the socket and lands us here. There is nobody left to notify, so clearing the connection
        // above is all the cleanup there is; broadcasting would just throw GameNotFoundException a second time.
        if (sessionRegistry.getSession(partyId).isEmpty()) {
            log.info(
                    "Player disconnected from a game session that no longer exists. PlayerID:{}, PartyID:{}",
                    playerId,
                    partyId);
            return;
        }

        PlayerDisconnectedEvent event = new PlayerDisconnectedEvent(playerId, partyId);
        broadcastToParty(partyId, new PlayerClientEventEnvelope(event));

        sseEventPublisher.publishNewConnectionEvent(partyId, playerId, ConnectionEvent.DISCONNECTED);
        log.info("Player disconnected! PlayerID:{}, PartyID:{}, WebsocketConnID:{}", playerId, partyId, "");
    }

    public void relinquishPlayer(String partyId, String playerId) {

        if (sessionRegistry.getSession(playerId).isEmpty()) {
            throw new SessionNotFoundException(playerId);
        }

        log.info(
                "Player relinquished! PlayerID:{}, PartyID:{}, WebsocketConnID:{}",
                playerId,
                partyId,
                getConnectionId(playerId));

        closeConnection(playerId);
        sessionRegistry.removeSession(playerId);

        PlayerRelinquishedEvent event = new PlayerRelinquishedEvent(playerId, partyId);
        broadcastToParty(partyId, new PlayerClientEventEnvelope(event));
    }

    public void onMessage(TokenInfo tokenInfo, WebsocketEnvelope<?> envelope) {

        if (!(envelope instanceof PlayerClientActionEnvelope(PlayerClientAction payload))) {
            throw new UnknownCategoryException("Only player actions allowed from player clients", 400);
        }

        String partyId = tokenInfo.getPartyId();
        String playerId = tokenInfo.getPlayerId();

        switch (payload) {
            case DrawCardAction(long duration) -> onDrawCardAction(duration, partyId, playerId);
            case RelinquishPlayerAction() -> relinquishPlayer(partyId, playerId);
            default ->
                throw new BaseException(
                        String.format(
                                "Action type %s not yet supported",
                                payload.getClass().getSimpleName()),
                        400);
        }
    }

    private void onDrawCardAction(long durationInMillis, String partyId, String playerId) {

        String currentPlayerId = gameService.getCurrentPlayer(partyId).id();
        if (!playerId.equals(currentPlayerId)) {
            throw new GameException("It's not your turn!", 400);
        }
        gameService.drawCard(durationInMillis, partyId);
    }
}
