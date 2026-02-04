package dk.mathiaskofod.services.session;

import dk.mathiaskofod.domain.game.events.*;
import dk.mathiaskofod.domain.game.exceptions.GameException;
import dk.mathiaskofod.domain.game.player.Player;
import dk.mathiaskofod.providers.exceptions.BaseException;
import dk.mathiaskofod.services.auth.models.TokenInfo;
import dk.mathiaskofod.services.session.actions.player.client.PlayerClientAction;
import dk.mathiaskofod.services.session.actions.player.client.RelinquishPlayerAction;
import dk.mathiaskofod.services.session.actions.shared.DrawCardAction;
import dk.mathiaskofod.services.session.envelopes.GameEventEnvelope;
import dk.mathiaskofod.services.session.envelopes.PlayerClientActionEnvelope;
import dk.mathiaskofod.services.session.envelopes.PlayerClientEventEnvelope;
import dk.mathiaskofod.services.session.envelopes.WebsocketEnvelope;
import dk.mathiaskofod.services.session.events.game.*;
import dk.mathiaskofod.services.session.events.playerclient.PlayerClientEvent;
import dk.mathiaskofod.services.session.events.playerclient.PlayerConnectedEvent;
import dk.mathiaskofod.services.session.events.playerclient.PlayerDisconnectedEvent;
import dk.mathiaskofod.services.session.events.playerclient.PlayerRelinquishedEvent;
import dk.mathiaskofod.services.session.exceptions.ResourceClaimException;
import dk.mathiaskofod.services.session.exceptions.SessionNotFoundException;
import dk.mathiaskofod.services.session.exceptions.UnknownCategoryException;
import dk.mathiaskofod.services.session.exceptions.UnknownEventException;
import dk.mathiaskofod.services.session.models.Session;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Event;
import jakarta.enterprise.event.Observes;
import jakarta.inject.Inject;
import lombok.extern.slf4j.Slf4j;

import java.util.Optional;

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
                .map(this::getSession)
                .flatMap(Optional::stream)
                .filter(session -> session.getConnectionId().isPresent())
                .forEach(session -> sendMessage(session.getSessionId(), message));

    }

    public void claimPlayer(String gameId, String playerId) {

        if (getSession(playerId).isPresent()) {
            String msg = String.format("Player with ID: %s, from game: %s, has already been claimed.",playerId, gameId);
            throw new ResourceClaimException(msg);
        }

        addSession(playerId, new Session(playerId));

        log.info("Player claimed! PlayerID:{}, GameID:{}", playerId, gameId);
    }

    public void onNewConnection(String websocketConnectionId, TokenInfo tokenInfo) {

        String gameId = tokenInfo.getGameId();
        String playerId = tokenInfo.getPlayerId();

        getSession(playerId)
                .orElseThrow(() -> {
                    String msg = String.format("Player: %s, in game: %s, either doesn't exist or have not been claimed", playerId,gameId);
                    return new ResourceClaimException(msg);
                })
                .setConnectionId(websocketConnectionId);

        broadcastPlayerEvent(new PlayerConnectedEvent(playerId, gameId));

        log.info("Websocket Connection: Type:New player connection, PlayerID:{}, GameID:{}, WebsocketConnID:{}", playerId, gameId, websocketConnectionId);
    }

    public void onConnectionClosed(TokenInfo tokenInfo) {

        String gameId = tokenInfo.getGameId();
        String playerId = tokenInfo.getPlayerId();

        getSession(playerId)
                .orElseThrow(() -> new SessionNotFoundException(playerId))
                .clearConnectionId();

        broadcastPlayerEvent(new PlayerDisconnectedEvent(playerId, gameId));

        log.info("Player disconnected! PlayerID:{}, GameID:{}, WebsocketConnID:{}", playerId, gameId, "");
    }

    public void relinquishPlayer(String gameId, String playerId) {

        String sessionId = getSession(playerId)
                .orElseThrow(() -> new SessionNotFoundException(playerId))
                        .getSessionId();

        log.info("Player relinquished! PlayerID:{}, GameID:{}, WebsocketConnID:{}", sessionId, gameId, getConnectionId(playerId));

        closeConnection(sessionId);
        removeSession(sessionId);

        broadcastPlayerEvent(new PlayerRelinquishedEvent(playerId, gameId));
    }

    public void onMessage(TokenInfo tokenInfo, WebsocketEnvelope envelope) {

        if (!(envelope instanceof PlayerClientActionEnvelope(PlayerClientAction payload))) {
            throw new UnknownCategoryException("Only player actions allowed from player clients", 400);
        }

        String gameId = tokenInfo.getGameId();
        String playerId = tokenInfo.getPlayerId();

        switch (payload) {
            case DrawCardAction(long duration) ->
                    onDrawCardAction(duration, gameId, playerId);
            case RelinquishPlayerAction() -> relinquishPlayer(gameId, playerId);
            default ->
                    throw new BaseException(String.format("Action type %s not yet supported", payload.getClass().getSimpleName()), 400);
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
        broadcastMessageToAllPlayersInGame(new PlayerClientEventEnvelope(playerClientEvent), playerClientEvent.gameId());
    }

    /**
     * Converts an incoming GameEvent into the corresponding DTO, wraps it in a GameEventEnvelope,
     * and broadcasts that envelope to all players in the event's game.
     *
     * @param gameEvent the event to convert and broadcast
     * @throws UnknownEventException if the event type is not recognized
     */
    void onGameEvent(@Observes GameEvent gameEvent) {

        GameEventDto dto = switch (gameEvent) {
            case StartGameEvent ignored -> new GameStartGameEventDto();
            case EndGameEvent endGameEvent -> GameEndEventDto.fromGameEvent(endGameEvent);
            case DrawCardEvent e -> DrawCardGameEventDto.fromGameEvent(e);
            case ChugEvent e -> ChugGameEventDto.fromGameEvent(e);
            case PauseGameEvent pausedGameEvent -> GamePausedGameEventDto.fromGameEvent(pausedGameEvent);
            case ResumeGameEvent resumeGameEvent -> GameResumedGameEventDto.fromGameEvent(resumeGameEvent);

            default -> throw new UnknownEventException(gameEvent.getClass().getSimpleName(), 500);
        };

        GameEventEnvelope envelope = new GameEventEnvelope(dto);

        broadcastMessageToAllPlayersInGame(envelope, gameEvent.gameId());
    }
}