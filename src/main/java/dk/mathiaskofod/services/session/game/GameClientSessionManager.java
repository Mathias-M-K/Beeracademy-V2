package dk.mathiaskofod.services.session.game;

import dk.mathiaskofod.domain.game.events.*;
import dk.mathiaskofod.providers.exceptions.BaseException;
import dk.mathiaskofod.services.auth.models.Token;
import dk.mathiaskofod.services.session.AbstractSessionManager;
import dk.mathiaskofod.services.session.actions.game.client.GameClientAction;
import dk.mathiaskofod.services.session.actions.game.client.StartGameAction;
import dk.mathiaskofod.services.session.actions.shared.EndOfTurnAction;
import dk.mathiaskofod.services.session.envelopes.PlayerClientEventEnvelope;
import dk.mathiaskofod.services.session.events.client.player.PlayerConnectedEvent;
import dk.mathiaskofod.services.session.events.client.player.PlayerDisconnectedEvent;
import dk.mathiaskofod.services.session.events.client.player.PlayerRelinquishedEvent;
import dk.mathiaskofod.services.session.events.domain.game.*;
import dk.mathiaskofod.services.session.game.exceptions.GameAlreadyClaimedException;
import dk.mathiaskofod.services.session.game.exceptions.GameNotClaimedException;
import dk.mathiaskofod.services.session.events.client.game.GameClientEvent;
import dk.mathiaskofod.services.session.exceptions.NoConnectionIdException;
import dk.mathiaskofod.domain.game.models.GameId;

import dk.mathiaskofod.services.session.game.exceptions.GameSessionNotFoundException;
import dk.mathiaskofod.services.session.envelopes.GameClientActionEnvelope;
import dk.mathiaskofod.services.session.envelopes.GameEventEnvelope;
import dk.mathiaskofod.services.session.envelopes.WebsocketEnvelope;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@ApplicationScoped
public class GameClientSessionManager extends AbstractSessionManager<GameSession, GameId, GameClientEvent> {


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

    public void onMessageReceived(GameId gameId, WebsocketEnvelope envelope) {

        if (!(envelope instanceof GameClientActionEnvelope(GameClientAction action))) {
            throw new BaseException("Invalid envelope type for game client action", 400);
        }

        switch (action) {
            case StartGameAction () -> gameService.startGame(gameId);
            case EndOfTurnAction endOfTurnAction -> gameService.endOfTurn(endOfTurnAction.duration(), gameId);
            default -> throw new BaseException("Unknown game client action type: " + action.getClass().getSimpleName(), 400);

        }
    }


    void onPlayerConnectedEvent(@Observes PlayerConnectedEvent playerConnectedEvent){
        sendMessage(playerConnectedEvent.gameId(), new PlayerClientEventEnvelope(playerConnectedEvent));
    }

    void onPlayerDisconnectedEvent(@Observes PlayerDisconnectedEvent playerDisconnectedEvent){
        sendMessage(playerDisconnectedEvent.gameId(), new PlayerClientEventEnvelope(playerDisconnectedEvent));
    }

    void onPlayerRelinquishedEvent(@Observes PlayerRelinquishedEvent playerRelinquishEvent){
        sendMessage(playerRelinquishEvent.gameId(), new PlayerClientEventEnvelope(playerRelinquishEvent));
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
