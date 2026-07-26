package dk.mathiaskofod.services.session;

import dk.mathiaskofod.domain.game.exceptions.GameException;
import dk.mathiaskofod.providers.exceptions.BaseException;
import dk.mathiaskofod.services.auth.models.TokenInfo;
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
import lombok.extern.slf4j.Slf4j;

@Slf4j
@ApplicationScoped
public class PlayerClientSessionManager extends AbstractGameSessionManager {

    public void onNewConnection(String websocketConnectionId, TokenInfo tokenInfo) {

        String gameId = tokenInfo.getGameId();
        String playerId = tokenInfo.getPlayerId();

        sessionRegistry.setConnectionId(playerId, websocketConnectionId);

        PlayerConnectedEvent event = new PlayerConnectedEvent(playerId, gameId);
        broadcastToParty(gameId, new PlayerClientEventEnvelope(event));

        provideGameSnapshotToClient(tokenInfo, PlayerClientEventEnvelope::new);
        provideIdentityToClient(tokenInfo, PlayerClientEventEnvelope::new);

        log.info(
                "Websocket Connection: Type:New player connection, PlayerID:{}, GameID:{}, WebsocketConnID:{}",
                playerId,
                gameId,
                websocketConnectionId);
    }

    public void onConnectionClosed(TokenInfo tokenInfo, CloseReason closeReason) {

        String gameId = tokenInfo.getGameId();
        String playerId = tokenInfo.getPlayerId();

        sessionRegistry.clearConnectionId(playerId);

        PlayerDisconnectedEvent event = new PlayerDisconnectedEvent(playerId, gameId);
        broadcastToParty(gameId, new PlayerClientEventEnvelope(event));

        log.info("Player disconnected! PlayerID:{}, GameID:{}, WebsocketConnID:{}", playerId, gameId, "");
    }

    public void relinquishPlayer(String gameId, String playerId) {

        if (sessionRegistry.getSession(playerId).isEmpty()) {
            throw new SessionNotFoundException(playerId);
        }

        log.info(
                "Player relinquished! PlayerID:{}, GameID:{}, WebsocketConnID:{}",
                playerId,
                gameId,
                getConnectionId(playerId));

        closeConnection(playerId);
        sessionRegistry.removeSession(playerId);

        PlayerRelinquishedEvent event = new PlayerRelinquishedEvent(playerId, gameId);
        broadcastToParty(gameId, new PlayerClientEventEnvelope(event));
    }

    public void onMessage(TokenInfo tokenInfo, WebsocketEnvelope<?> envelope) {

        if (!(envelope instanceof PlayerClientActionEnvelope(PlayerClientAction payload))) {
            throw new UnknownCategoryException("Only player actions allowed from player clients", 400);
        }

        String gameId = tokenInfo.getGameId();
        String playerId = tokenInfo.getPlayerId();

        switch (payload) {
            case DrawCardAction(long duration) -> onDrawCardAction(duration, gameId, playerId);
            case RelinquishPlayerAction() -> relinquishPlayer(gameId, playerId);
            default -> throw new BaseException(
                    String.format(
                            "Action type %s not yet supported",
                            payload.getClass().getSimpleName()),
                    400);
        }
    }

    private void onDrawCardAction(long durationInMillis, String gameId, String playerId) {

        String currentPlayerId = gameService.getCurrentPlayer(gameId).id();
        if (!playerId.equals(currentPlayerId)) {
            throw new GameException("It's not your turn!", 400);
        }
        gameService.drawCard(durationInMillis, gameId);
    }
}
