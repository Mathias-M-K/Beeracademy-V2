package dk.mathiaskofod.services.session.game;

import dk.mathiaskofod.domain.game.events.events.*;
import dk.mathiaskofod.domain.game.events.events.ResumeGameEvent;
import dk.mathiaskofod.services.auth.AuthService;
import dk.mathiaskofod.services.auth.models.Token;
import dk.mathiaskofod.services.session.AbstractSessionManager;
import dk.mathiaskofod.services.session.exceptions.WebsocketConnectionNotFoundException;
import dk.mathiaskofod.services.session.game.exceptions.GameAlreadyClaimedException;
import dk.mathiaskofod.services.session.game.exceptions.GameNotClaimedException;
import dk.mathiaskofod.services.session.exceptions.NoConnectionIdException;
import dk.mathiaskofod.services.game.GameService;
import dk.mathiaskofod.services.game.id.generator.models.GameId;

import dk.mathiaskofod.services.session.game.exceptions.GameSessionNotFoundException;
import dk.mathiaskofod.services.session.game.models.GameSession;
import dk.mathiaskofod.services.session.models.events.game.*;
import dk.mathiaskofod.services.session.models.wrapper.GameEventWrapper;
import io.quarkus.websockets.next.OpenConnections;
import io.quarkus.websockets.next.WebSocketConnection;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.inject.Inject;
import lombok.extern.slf4j.Slf4j;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Slf4j
@ApplicationScoped
public class GameClientSessionManager extends AbstractSessionManager<GameSession, GameId> {


    @Override
    protected String getConnectionId(GameId id) {
        return getSession(id).
                orElseThrow(() -> new GameSessionNotFoundException(id))
                .getConnectionId()
                .orElseThrow(() -> new NoConnectionIdException(id));
    }

    //TODO seems weird to be calling getGame without using it
    public Token claimGame(GameId gameId) {

        //Checks whether the game exists
        gameService.getGame(gameId);

        if (getSession(gameId).isPresent()) {
            throw new GameAlreadyClaimedException(gameId);
        }

        addSession(gameId, new GameSession(gameId));

        return authService.createGameClientToken(gameId);
    }

    public void registerConnection(GameId gameId, String websocketConnId) {

        getSession(gameId)
                .orElseThrow(() -> new GameNotClaimedException(gameId))
                .setConnectionId(websocketConnId);

        log.info("Websocket Connection: Type:New game client connection, GameID:{}, WebsocketConnID:{}", gameId.humanReadableId(), websocketConnId);

    }

    public void registerDisconnect(GameId gameId) {

        getSession(gameId)
                .orElseThrow(() -> new GameSessionNotFoundException(gameId))
                .clearConnectionId();

        log.info("Game client disconnected. GameID:{}", gameId.humanReadableId());
    }


    void onStartGameEvent(@Observes StartGameEvent event) {

        GameStartGameEventDto gameStartGameEventDto = GameStartGameEventDto.fromGameEvent(event);

        WebSocketConnection connection = getWebsocketConnection(event.gameId());

        connection.sendTextAndAwait(new GameEventWrapper(gameStartGameEventDto));
    }

    void onEndGameEvent(@Observes EndGameEvent event) {

        GameEndGameEventDto gameEndGameEventDto = GameEndGameEventDto.fromGameEvent(event);

        WebSocketConnection connection = getWebsocketConnection(event.gameId());
        connection.sendTextAndAwait(gameEndGameEventDto);
    }

    void onEndOfTurnEvent(@Observes EndOfTurnEvent event) {

        EndOfTurnGameEventDto endOfTurnGameEventDto = EndOfTurnGameEventDto.fromGameEvent(event);

        WebSocketConnection connection = getWebsocketConnection(event.gameId());
        connection.sendTextAndAwait(endOfTurnGameEventDto);
    }

    void onChugEvent(@Observes ChugEvent event) {
        ChugGameEventDto chugGameEventDto = ChugGameEventDto.fromGameEvent(event);

        WebSocketConnection connection = getWebsocketConnection(event.gameId());
        connection.sendTextAndAwait(chugGameEventDto);
    }

    void onPauseEvent(@Observes PauseGameEvent event) {

        GamePausedGameEventDto gamePausedGameEventDto = GamePausedGameEventDto.fromGameEvent(event);

        WebSocketConnection connection = getWebsocketConnection(event.gameId());
        connection.sendTextAndAwait(gamePausedGameEventDto);
    }

    void onResumeEvent(@Observes ResumeGameEvent event) {

        GameResumedGameEventDto resumeEventDto = GameResumedGameEventDto.fromGameEvent(event);

        WebSocketConnection connection = getWebsocketConnection(event.gameId());
        connection.sendTextAndAwait(resumeEventDto);
    }


}
