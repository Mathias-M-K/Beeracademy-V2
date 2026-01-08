package dk.mathiaskofod.services.session;

import dk.mathiaskofod.domain.game.Game;
import dk.mathiaskofod.domain.game.events.*;
import dk.mathiaskofod.domain.game.models.Chug;
import dk.mathiaskofod.services.auth.models.TokenInfo;
import dk.mathiaskofod.services.session.actions.game.client.*;
import dk.mathiaskofod.services.session.actions.shared.DrawCardAction;
import dk.mathiaskofod.services.session.envelopes.*;
import dk.mathiaskofod.services.session.events.gameclient.GameClientConnectedEvent;
import dk.mathiaskofod.services.session.events.playerclient.PlayerClientEvent;
import dk.mathiaskofod.services.session.events.game.*;
import dk.mathiaskofod.services.session.exceptions.*;

import dk.mathiaskofod.services.session.models.Session;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import lombok.extern.slf4j.Slf4j;

import java.time.Duration;

@Slf4j
@ApplicationScoped
public class GameClientSessionManager extends AbstractSessionManager {


    public void claimGame(String gameId) {

        //Checks whether the game exist
        gameService.getGame(gameId);

        if (getSession(gameId).isPresent()) {
            String msg = String.format("The game with id %s is already claimed.", gameId);
            throw new ResourceClaimException(msg);
        }

        addSession(gameId, new Session(gameId));
    }

    public void onNewConnection(String websocketConnectionId, TokenInfo tokenInfo) {

        String gameId = tokenInfo.getGameId();

        getSession(gameId)
                .orElseThrow(() -> {
                    String msg = String.format("The game with id %s either doesn't exist or haven't been claimed.", gameId);
                    return new ResourceClaimException(msg);
                })
                .setConnectionId(websocketConnectionId);

        log.info("Websocket Connection: Type:New game client connection, GameID:{}, WebsocketConnID:{}", gameId, websocketConnectionId);

        Game game = gameService.getGame(gameId);
        GameClientConnectedEvent gameClientConnectedEvent = new GameClientConnectedEvent(game);
        broadcastToGameClient(gameId, new GameClientEventEnvelope(gameClientConnectedEvent));

    }

    public void onConnectionClosed(TokenInfo tokenInfo) {

        String gameId = tokenInfo.getGameId();

        getSession(gameId)
                .orElseThrow(() -> new SessionNotFoundException(gameId))
                .clearConnectionId();

        log.info("Game client disconnected. GameID:{}", gameId);
    }

    public void onMessage(TokenInfo tokenInfo, WebsocketEnvelope envelope) {

        if (!(envelope instanceof GameClientActionEnvelope(GameClientAction action))) {
            throw new UnknownCategoryException("Invalid envelope type for game client action", 400);
        }

        String gameId = tokenInfo.getGameId();
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

    private void broadcastToGameClient(String gameId, WebsocketEnvelope message) {
        sendMessage(gameId, message);
    }

    /**
     * Player Events
     **/
    void onPlayerClientEvent(@Observes PlayerClientEvent playerClientEvent) {
        broadcastToGameClient(playerClientEvent.gameId(), new PlayerClientEventEnvelope(playerClientEvent));
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
