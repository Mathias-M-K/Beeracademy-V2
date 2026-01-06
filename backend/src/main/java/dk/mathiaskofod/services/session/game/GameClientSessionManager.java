package dk.mathiaskofod.services.session.game;

import dk.mathiaskofod.domain.game.events.*;
import dk.mathiaskofod.domain.game.models.Chug;
import dk.mathiaskofod.services.session.AbstractSessionManager;
import dk.mathiaskofod.services.session.actions.game.client.*;
import dk.mathiaskofod.services.session.actions.shared.DrawCardAction;
import dk.mathiaskofod.services.session.envelopes.PlayerClientEventEnvelope;
import dk.mathiaskofod.services.session.events.client.player.PlayerClientEvent;
import dk.mathiaskofod.services.session.events.domain.game.*;
import dk.mathiaskofod.services.session.exceptions.UnknownActionException;
import dk.mathiaskofod.services.session.exceptions.UnknownCategoryException;
import dk.mathiaskofod.services.session.exceptions.UnknownEventException;
import dk.mathiaskofod.services.session.game.exceptions.*;
import dk.mathiaskofod.services.session.exceptions.NoConnectionIdException;

import dk.mathiaskofod.services.session.envelopes.GameClientActionEnvelope;
import dk.mathiaskofod.services.session.envelopes.GameEventEnvelope;
import dk.mathiaskofod.services.session.envelopes.WebsocketEnvelope;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import lombok.extern.slf4j.Slf4j;

import java.time.Duration;

@Slf4j
@ApplicationScoped
public class GameClientSessionManager extends AbstractSessionManager<GameSession, String> {


    @Override
    protected String getConnectionId(String id) {
        return getSession(id).
                orElseThrow(() -> new GameSessionNotFoundException(id))
                .getConnectionId()
                .orElseThrow(() -> new NoConnectionIdException(id));
    }

    public String claimGame(String gameId) {

        gameService.getGame(gameId);

        if (getSession(gameId).isPresent()) {
            throw new GameAlreadyClaimedException(gameId);
        }

        addSession(gameId, new GameSession(gameId));

        return authService.createGameClientToken(gameId);
    }

    public void registerConnection(String gameId, String websocketConnId) {

        getSession(gameId)
                .orElseThrow(() -> new GameNotClaimedException(gameId))
                .setConnectionId(websocketConnId);

        log.info("Websocket Connection: Type:New game client connection, GameID:{}, WebsocketConnID:{}", gameId, websocketConnId);
    }

    public void registerDisconnect(String gameIdDto) {

        getSession(gameIdDto)
                .orElseThrow(() -> new GameSessionNotFoundException(gameIdDto))
                .clearConnectionId();

        log.info("Game client disconnected. GameID:{}", gameIdDto);
    }

    public void onMessageReceived(String gameId, WebsocketEnvelope envelope) {

        if (!(envelope instanceof GameClientActionEnvelope(GameClientAction action))) {
            throw new UnknownCategoryException("Invalid envelope type for game client action", 400);
        }

        switch (action) {
            case StartGameAction() -> gameService.startGame(gameId);
            case EndGameAction() -> gameService.endGame(gameId);
            case PauseGameAction() -> gameService.pauseGame(gameId);
            case ResumeGameAction() -> gameService.resumeGame(gameId);
            case DrawCardAction drawCardAction -> gameService.drawCard(drawCardAction.duration(), gameId);
            case RegisterChugAction registerChugAction -> onRegisterChug(registerChugAction, gameId);
            default -> throw new UnknownActionException(action.getClass().getSimpleName(), 500);
        }
    }

    private void onRegisterChug(RegisterChugAction action, String gameId) {
        Chug chug = new Chug(action.suit(), Duration.ofMillis(action.duration()));
        gameService.registerChug(chug, gameId);
    }

    /**
     * Player Events
     **/
    void onPlayerEvent(@Observes PlayerClientEvent playerClientEvent) {
        try {
            sendMessage(playerClientEvent.gameId(), new PlayerClientEventEnvelope(playerClientEvent));
        } catch (NoConnectionIdException noConnectionIdException) {
            log.info("No game client connected to receive player event: {}", playerClientEvent);
        }

    }

    /**
     * Game Events
     **/
    void onGameEvent(@Observes GameEvent gameEvent) {

        GameEventDto dto = switch (gameEvent) {
            case StartGameEvent ignored -> new GameStartGameEventDto();
            case EndGameEvent endGameEvent -> GameEndGameEventDto.fromGameEvent(endGameEvent);
            case DrawCardEvent e -> DrawCardGameEventDto.fromGameEvent(e);
            case ChugEvent e -> ChugGameEventDto.fromGameEvent(e);
            case PauseGameEvent ignored -> new GamePausedGameEventDto();
            case ResumeGameEvent ignored -> new GameResumedGameEventDto();

            default -> throw new UnknownEventException(gameEvent.getClass().getSimpleName(), 500);
        };

        GameEventEnvelope envelope = new GameEventEnvelope(dto);

        try {
            sendMessage(gameEvent.gameId(), envelope);
        } catch (NoConnectionIdException noConnectionIdException) {
            log.info("No game client connected to receive game event: {}", gameEvent);
        }

    }
}
