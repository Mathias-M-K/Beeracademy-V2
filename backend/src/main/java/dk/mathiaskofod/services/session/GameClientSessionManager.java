package dk.mathiaskofod.services.session;

import dk.mathiaskofod.common.dto.game.GameDto;
import dk.mathiaskofod.domain.game.events.*;
import dk.mathiaskofod.domain.game.models.Chug;
import dk.mathiaskofod.services.auth.models.TokenInfo;
import dk.mathiaskofod.services.game.exceptions.GameNotFoundException;
import dk.mathiaskofod.services.session.actions.game.client.*;
import dk.mathiaskofod.services.session.actions.game.shared.DrawCardAction;
import dk.mathiaskofod.services.session.envelopes.*;
import dk.mathiaskofod.services.session.events.game.*;
import dk.mathiaskofod.services.session.events.gameclient.GameClientConnectedEvent;
import dk.mathiaskofod.services.session.events.playerclient.PlayerClientEvent;
import dk.mathiaskofod.services.session.exceptions.UnknownActionException;
import dk.mathiaskofod.services.session.exceptions.UnknownCategoryException;
import dk.mathiaskofod.services.session.exceptions.UnknownEventException;
import io.quarkus.websockets.next.CloseReason;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@ApplicationScoped
public class GameClientSessionManager extends AbstractSessionManager {

    public void onNewConnection(String websocketConnectionId, TokenInfo tokenInfo) {

        String gameId = tokenInfo.getGameId();

        if (!gameService.gameExists(gameId)) {
            throw new GameNotFoundException(gameId);
        }

        sessionRegistry.setConnectionId(gameId, websocketConnectionId);

        log.info(
                "Websocket Connection: Type:New game client connection, GameID:{}, WebsocketConnID:{}",
                gameId,
                websocketConnectionId);

        GameDto game = lobbyService.getGame(gameId);
        GameClientConnectedEvent gameClientConnectedEvent = new GameClientConnectedEvent(game);
        sendMessage(gameId, new GameClientEventEnvelope(gameClientConnectedEvent));
    }

    public void onConnectionClosed(TokenInfo tokenInfo, CloseReason closeReason) {

        String gameId = tokenInfo.getGameId();

        sessionRegistry.clearConnectionId(gameId);

        log.info("Game client disconnected. GameID:{}", gameId);
    }

    public void onMessage(TokenInfo tokenInfo, WebsocketEnvelope<?> envelope) {

        if (!(envelope instanceof GameClientActionEnvelope(GameClientAction action))) {
            throw new UnknownCategoryException("Invalid envelope type for game client action", 400);
        }

        String gameId = tokenInfo.getGameId();
        switch (action) {
            case StartGameAction() -> gameService.startGame(gameId);
            case EndGameAction() -> gameService.endGame(gameId);
            case PauseGameAction() -> gameService.pauseGame(gameId);
            case ResumeGameAction() -> gameService.resumeGame(gameId);
            case DrawCardAction(long duration) -> gameService.drawCard(duration, gameId);
            case RegisterChugAction(Chug chug) -> gameService.registerChug(chug, gameId);
            default -> throw new UnknownActionException(action.getClass().getSimpleName(), 500);
        }
    }

    /** Player Events */
    void onPlayerClientEvent(@Observes PlayerClientEvent playerClientEvent) {
        sendMessage(playerClientEvent.gameId(), new PlayerClientEventEnvelope(playerClientEvent));
    }

    /** Game Events */
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

        sendMessage(gameEvent.gameId(), envelope);
    }
}
