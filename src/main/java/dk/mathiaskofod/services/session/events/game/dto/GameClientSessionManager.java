package dk.mathiaskofod.services.session.events.game.dto;

import dk.mathiaskofod.domain.game.events.*;
import dk.mathiaskofod.services.auth.models.Token;
import dk.mathiaskofod.services.session.AbstractSessionManager;
import dk.mathiaskofod.services.session.events.game.dto.exceptions.GameAlreadyClaimedException;
import dk.mathiaskofod.services.session.events.game.dto.exceptions.GameNotClaimedException;
import dk.mathiaskofod.services.session.exceptions.NoConnectionIdException;
import dk.mathiaskofod.domain.game.models.GameId;

import dk.mathiaskofod.services.session.events.game.dto.exceptions.GameSessionNotFoundException;
import dk.mathiaskofod.services.session.models.events.game.*;
import dk.mathiaskofod.services.session.wrapper.GameEventEnvelope;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import lombok.extern.slf4j.Slf4j;

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
        GameEventEnvelope envelope = new GameEventEnvelope(gameStartGameEventDto);
        sendMessage(event.gameId(), envelope);
    }

    void onEndGameEvent(@Observes EndGameEvent event) {

        GameEndGameEventDto gameEndGameEventDto = GameEndGameEventDto.fromGameEvent(event);
        GameEventEnvelope envelope = new GameEventEnvelope(gameEndGameEventDto);
        sendMessage(event.gameId(), envelope);
    }

    void onEndOfTurnEvent(@Observes EndOfTurnEvent event) {

        EndOfTurnGameEventDto endOfTurnGameEventDto = EndOfTurnGameEventDto.fromGameEvent(event);
        GameEventEnvelope envelope = new GameEventEnvelope(endOfTurnGameEventDto);
        sendMessage(event.gameId(), envelope);
    }

    void onChugEvent(@Observes ChugEvent event) {
        ChugGameEventDto chugGameEventDto = ChugGameEventDto.fromGameEvent(event);
        GameEventEnvelope envelope = new GameEventEnvelope(chugGameEventDto);
        sendMessage(event.gameId(), envelope);
    }

    void onPauseEvent(@Observes PauseGameEvent event) {

        GamePausedGameEventDto gamePausedGameEventDto = GamePausedGameEventDto.fromGameEvent(event);
        GameEventEnvelope envelope = new GameEventEnvelope(gamePausedGameEventDto);
        sendMessage(event.gameId(), envelope);
    }

    void onResumeEvent(@Observes ResumeGameEvent event) {

        GameResumedGameEventDto resumeEventDto = GameResumedGameEventDto.fromGameEvent(event);
        GameEventEnvelope envelope = new GameEventEnvelope(resumeEventDto);
        sendMessage(event.gameId(), envelope);
    }




}
