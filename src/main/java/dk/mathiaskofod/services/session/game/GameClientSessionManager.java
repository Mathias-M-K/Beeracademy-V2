package dk.mathiaskofod.services.session.game;

import dk.mathiaskofod.domain.game.events.*;
import dk.mathiaskofod.providers.exceptions.BaseException;
import dk.mathiaskofod.services.auth.models.Token;
import dk.mathiaskofod.services.session.AbstractSessionManager;
import dk.mathiaskofod.services.session.actions.game.client.GameClientAction;
import dk.mathiaskofod.services.session.actions.game.client.StartGameAction;
import dk.mathiaskofod.services.session.actions.shared.EndOfTurnAction;
import dk.mathiaskofod.services.session.envelopes.PlayerClientEventEnvelope;
import dk.mathiaskofod.services.session.events.client.player.PlayerClientEvent;
import dk.mathiaskofod.services.session.events.domain.game.*;
import dk.mathiaskofod.services.session.game.exceptions.GameAlreadyClaimedException;
import dk.mathiaskofod.services.session.game.exceptions.GameNotClaimedException;
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


    /** Player Events **/
    void onPlayerConnectedEvent(@Observes PlayerClientEvent playerClientEvent){
        sendMessage(playerClientEvent.gameId(), new PlayerClientEventEnvelope(playerClientEvent));
    }

    /** Game Events **/

    void onGameEvent(@Observes GameEvent gameEvent){

        GameEventDto dto = switch (gameEvent) {
            case StartGameEvent e -> GameStartGameEventDto.fromGameEvent(e);
            case EndGameEvent e   -> GameEndGameEventDto.fromGameEvent(e);
            case EndOfTurnEvent e -> EndOfTurnGameEventDto.fromGameEvent(e);
            case ChugEvent e      -> ChugGameEventDto.fromGameEvent(e);
            case PauseGameEvent e -> GamePausedGameEventDto.fromGameEvent(e);
            case ResumeGameEvent e-> GameResumedGameEventDto.fromGameEvent(e);

            //FIXME: Real exception
            default -> throw new IllegalArgumentException("No DTO mapping for event: " + gameEvent.getClass());
        };

        // 2. Wrap (if you are still using the envelope)
        GameEventEnvelope envelope = new GameEventEnvelope(dto);

        // 3. Send (Shared logic)
        sendMessage(gameEvent.gameId(), envelope);
    }
}
