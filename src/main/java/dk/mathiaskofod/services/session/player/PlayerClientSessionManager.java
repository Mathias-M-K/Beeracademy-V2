package dk.mathiaskofod.services.session.player;

import dk.mathiaskofod.domain.game.events.*;
import dk.mathiaskofod.providers.exceptions.BaseException;
import dk.mathiaskofod.services.auth.models.PlayerTokenInfo;
import dk.mathiaskofod.services.auth.models.Token;
import dk.mathiaskofod.services.session.AbstractSessionManager;
import dk.mathiaskofod.services.session.actions.player.client.RelinquishPlayerAction;
import dk.mathiaskofod.services.session.envelopes.GameEventEnvelope;
import dk.mathiaskofod.services.session.envelopes.PlayerClientEventEnvelope;
import dk.mathiaskofod.services.session.events.client.player.PlayerClientEvent;
import dk.mathiaskofod.services.session.events.client.player.PlayerConnectedEvent;
import dk.mathiaskofod.services.session.events.client.player.PlayerDisconnectedEvent;
import dk.mathiaskofod.services.session.events.client.player.PlayerRelinquishedEvent;
import dk.mathiaskofod.services.session.events.domain.game.*;
import dk.mathiaskofod.services.session.exceptions.NoConnectionIdException;
import dk.mathiaskofod.domain.game.models.GameId;
import dk.mathiaskofod.services.session.actions.player.client.PlayerClientAction;
import dk.mathiaskofod.services.session.actions.shared.DrawCardAction;
import dk.mathiaskofod.services.session.envelopes.PlayerClientActionEnvelope;
import dk.mathiaskofod.services.session.envelopes.WebsocketEnvelope;
import dk.mathiaskofod.services.session.player.exeptions.PlayerAlreadyClaimedException;
import dk.mathiaskofod.services.session.player.exeptions.PlayerNotClaimedException;
import dk.mathiaskofod.domain.game.player.Player;
import dk.mathiaskofod.services.session.player.exeptions.PlayerSessionNotFoundException;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Event;
import jakarta.enterprise.event.Observes;
import jakarta.inject.Inject;
import lombok.extern.slf4j.Slf4j;

import java.util.Optional;

@Slf4j
@ApplicationScoped
public class PlayerClientSessionManager extends AbstractSessionManager<PlayerSession, String> {

    @Inject
    Event<PlayerClientEvent> eventBus;

    protected String getConnectionId(String playerId) {

        return getSession(playerId)
                .orElseThrow(() -> new PlayerSessionNotFoundException(playerId))
                .getConnectionId()
                .orElseThrow(() -> new NoConnectionIdException(playerId));
    }

    private void broadcastPlayerEvent(PlayerClientEvent event) {
        eventBus.fire(event);
    }

    private void sendMessageToAllPlayersInAGame(WebsocketEnvelope envelope, GameId gameId) {
        gameService.getGame(gameId).getPlayers().stream()
                .map(Player::id)
                .map(this::getSession)
                .flatMap(Optional::stream)
                .filter(session -> session.getConnectionId().isPresent())
                .forEach(session -> sendMessage(session.getPlayerId(), envelope));

    }

    public Token claimPlayer(GameId gameId, String playerId) {

        Player player = gameService.getPlayer(gameId, playerId);

        if (getSession(playerId).isPresent()) {
            throw new PlayerAlreadyClaimedException(playerId, gameId);
        }

        addSession(playerId, new PlayerSession(playerId));

        log.info("Player claimed! PlayerID:{}, GameID:{}", playerId, gameId.humanReadableId());
        return authService.createPlayerClientToken(player, gameId);
    }

    public void registerConnection(GameId gameId, String playerId, String websocketConnId) {

        getSession(playerId)
                .orElseThrow(() -> new PlayerNotClaimedException(playerId, gameId))
                .setConnectionId(websocketConnId);

        broadcastPlayerEvent(new PlayerConnectedEvent(playerId, gameId));

        log.info("Websocket Connection: Type:New player connection, PlayerName:{}, PlayerID:{}, GameID:{}, WebsocketConnID:{}", "Unknown", playerId, gameId.humanReadableId(), websocketConnId);
    }

    public void registerDisconnect(GameId gameId, String playerId) {

        getSession(playerId)
                .orElseThrow(() -> new PlayerSessionNotFoundException(playerId))
                .clearConnectionId();

        broadcastPlayerEvent(new PlayerDisconnectedEvent(playerId, gameId));

        log.info("Player disconnected! PlayerName:{}, PlayerID:{}, GameID:{}, WebsocketConnID:{}", "Unknown", playerId, gameId.humanReadableId(), "");
    }

    public void relinquishPlayer(GameId gameId, String playerId) {

        PlayerSession playerSession = getSession(playerId)
                .orElseThrow(() -> new PlayerSessionNotFoundException(playerId));

        log.info("Player relinquished! PlayerName:{}, PlayerID:{}, GameID:{}, WebsocketConnID:{}", "Unknown", playerSession.getPlayerId(), gameId.humanReadableId(), getConnectionId(playerId));

        closeConnection(playerId);
        removeSession(playerId);

        broadcastPlayerEvent(new PlayerRelinquishedEvent(playerId, gameId));
    }

    public void onMessageReceived(WebsocketEnvelope envelope, PlayerTokenInfo tokenInfo) {

        if (!(envelope instanceof PlayerClientActionEnvelope(PlayerClientAction payload))) {
            throw new BaseException("Only player actions allowed from player clients", 400);
        }

        switch (payload) {
            case DrawCardAction drawCardAction ->
                    onDrawCardAction(drawCardAction.duration(), tokenInfo.gameId(), tokenInfo.playerId());
            case RelinquishPlayerAction() -> relinquishPlayer(tokenInfo.gameId(), tokenInfo.playerId());
            default ->
                    throw new BaseException(String.format("Action type %s not yet supported", payload.getClass().getSimpleName()), 400);
        }
    }

    private void onDrawCardAction(long durationInMillis, GameId gameId, String playerId) {

        String currentPlayerId = gameService.getCurrentPlayer(gameId).id();
        if (!playerId.equals(currentPlayerId)) {
            throw new BaseException("It's not your turn!", 400); //FIXME custom exception
        }
        gameService.drawCard(durationInMillis, gameId);
    }

    void onPlayerEvent(@Observes PlayerClientEvent playerClientEvent) {
        sendMessageToAllPlayersInAGame(new PlayerClientEventEnvelope(playerClientEvent), playerClientEvent.gameId());
    }

    void onGameEvent(@Observes GameEvent gameEvent) {

        GameEventDto dto = switch (gameEvent) {
            case StartGameEvent ignored -> new GameStartGameEventDto();
            case EndGameEvent endGameEvent -> GameEndGameEventDto.fromGameEvent(endGameEvent);
            case DrawCardEvent e -> DrawCardGameEventDto.fromGameEvent(e);
            case ChugEvent e -> ChugGameEventDto.fromGameEvent(e);
            case PauseGameEvent ignored -> new GamePausedGameEventDto();
            case ResumeGameEvent ignored -> new GameResumedGameEventDto();

            //FIXME: Real exception
            default -> throw new IllegalArgumentException("No DTO mapping for event: " + gameEvent.getClass());
        };

        // 2. Wrap (if you are still using the envelope)
        GameEventEnvelope envelope = new GameEventEnvelope(dto);

        // 3. Send (Shared logic)
        sendMessageToAllPlayersInAGame(envelope, gameEvent.gameId());
    }
}
