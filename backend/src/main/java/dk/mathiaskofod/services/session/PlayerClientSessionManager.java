package dk.mathiaskofod.services.session;

import dk.mathiaskofod.domain.game.events.*;
import dk.mathiaskofod.domain.game.exceptions.GameException;
import dk.mathiaskofod.domain.game.player.Player;
import dk.mathiaskofod.providers.exceptions.BaseException;
import dk.mathiaskofod.services.auth.models.TokenInfo;
import dk.mathiaskofod.services.session.actions.game.player.PlayerClientAction;
import dk.mathiaskofod.services.session.actions.game.player.RelinquishPlayerAction;
import dk.mathiaskofod.services.session.actions.game.shared.DrawCardAction;
import dk.mathiaskofod.services.session.envelopes.GameEventEnvelope;
import dk.mathiaskofod.services.session.envelopes.PlayerClientActionEnvelope;
import dk.mathiaskofod.services.session.envelopes.PlayerClientEventEnvelope;
import dk.mathiaskofod.services.session.envelopes.WebsocketEnvelope;
import dk.mathiaskofod.services.session.events.game.*;
import dk.mathiaskofod.services.session.events.playerclient.PlayerClientEvent;
import dk.mathiaskofod.services.session.events.playerclient.PlayerConnectedEvent;
import dk.mathiaskofod.services.session.events.playerclient.PlayerDisconnectedEvent;
import dk.mathiaskofod.services.session.events.playerclient.PlayerRelinquishedEvent;
import dk.mathiaskofod.services.session.exceptions.SessionNotFoundException;
import dk.mathiaskofod.services.session.exceptions.UnknownCategoryException;
import dk.mathiaskofod.services.session.exceptions.UnknownEventException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Event;
import jakarta.enterprise.event.Observes;
import jakarta.inject.Inject;
import java.util.Optional;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@ApplicationScoped
public class PlayerClientSessionManager extends AbstractSessionManager {

    @Inject
    Event<PlayerClientEvent> eventBus;

    private void broadcastPlayerEvent(PlayerClientEvent event) {
        eventBus.fire(event);
    }

    private void broadcastMessageToAllPlayersInGame(WebsocketEnvelope message, String gameId) {
        gameService.getGame(gameId).getPlayers().stream()
                .map(Player::id)
                .map(sessionRegistry::getSession)
                .flatMap(Optional::stream)
                .filter(session -> session.getConnectionId().isPresent())
                .forEach(session -> {
                    try {
                        sendMessage(session.getSessionId(), message);
                    } catch (Exception e) {
                        log.warn("Failed to send message to session {}: {}", session.getSessionId(), e.getMessage());
                    }
                });
    }

    public void onNewConnection(String websocketConnectionId, TokenInfo tokenInfo) {

        String gameId = tokenInfo.getGameId();
        String playerId = tokenInfo.getPlayerId();

        sessionRegistry.setConnectionId(playerId, websocketConnectionId);

        broadcastPlayerEvent(new PlayerConnectedEvent(playerId, gameId));

        log.info(
                "Websocket Connection: Type:New player connection, PlayerID:{}, GameID:{}, WebsocketConnID:{}",
                playerId,
                gameId,
                websocketConnectionId);
    }

    public void onConnectionClosed(TokenInfo tokenInfo) {

        String gameId = tokenInfo.getGameId();
        String playerId = tokenInfo.getPlayerId();

        sessionRegistry.clearConnectionId(playerId);

        broadcastPlayerEvent(new PlayerDisconnectedEvent(playerId, gameId));

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

        broadcastPlayerEvent(new PlayerRelinquishedEvent(playerId, gameId));
    }

    public void onMessage(TokenInfo tokenInfo, WebsocketEnvelope envelope) {

        if (!(envelope instanceof PlayerClientActionEnvelope(PlayerClientAction payload))) {
            throw new UnknownCategoryException("Only player actions allowed from player clients", 400);
        }

        String gameId = tokenInfo.getGameId();
        String playerId = tokenInfo.getPlayerId();

        switch (payload) {
            case DrawCardAction(long duration) -> onDrawCardAction(duration, gameId, playerId);
            case RelinquishPlayerAction() -> relinquishPlayer(gameId, playerId);
            default ->
                throw new BaseException(
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

    void onPlayerEvent(@Observes PlayerClientEvent playerClientEvent) {
        broadcastMessageToAllPlayersInGame(
                new PlayerClientEventEnvelope(playerClientEvent), playerClientEvent.gameId());
    }

    void onGameEvent(@Observes GameEvent gameEvent) {

        GameEventDto dto =
                switch (gameEvent) {
                    case StartGameEvent ignored -> new GameStartGameEventDto();
                    case EndGameEvent endGameEvent -> GameEndEventDto.fromGameEvent(endGameEvent);
                    case DrawCardEvent e -> DrawCardGameEventDto.fromGameEvent(e);
                    case ChugEvent e -> ChugGameEventDto.fromGameEvent(e);
                    case PauseGameEvent pausedGameEvent -> GamePausedGameEventDto.fromGameEvent(pausedGameEvent);
                    case ResumeGameEvent resumeGameEvent -> GameResumedGameEventDto.fromGameEvent(resumeGameEvent);

                    default ->
                        throw new UnknownEventException(gameEvent.getClass().getSimpleName(), 500);
                };

        GameEventEnvelope envelope = new GameEventEnvelope(dto);

        broadcastMessageToAllPlayersInGame(envelope, gameEvent.gameId());
    }
}
