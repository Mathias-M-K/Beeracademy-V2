package dk.mathiaskofod.domain.game.events.emitter;

import dk.mathiaskofod.domain.game.events.*;
import dk.mathiaskofod.domain.game.models.Chug;
import dk.mathiaskofod.domain.game.models.Turn;
import dk.mathiaskofod.domain.game.models.GameId;
import dk.mathiaskofod.domain.game.player.Player;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Event;
import jakarta.inject.Inject;

import java.time.Duration;

@ApplicationScoped
public class GameEventEmitterImpl implements GameEventEmitter {

    @Inject
    Event<GameEvent> eventBus;


    @Override
    public void onStartGame(GameId gameId) {
        eventBus.fire(new StartGameEvent(gameId));
    }

    @Override
    public void onEndGame(GameId gameId, Duration gameDuration) {
        eventBus.fire(new EndGameEvent(gameId));
    }

    @Override
    public void onDrawCard(Turn turn, Player previousPlayer, Player newPlayer, Player nextPlayer, GameId gameId) {
        eventBus.fire(new DrawCardEvent(turn, previousPlayer, newPlayer, nextPlayer, gameId));
    }

    @Override
    public void onNewChug(Chug chug, Player player, GameId gameId) {
        eventBus.fire(new ChugEvent(chug,player,gameId));
    }

    @Override
    public void onPauseGame(GameId gameId) {
        eventBus.fire(new PauseGameEvent(gameId));
    }

    @Override
    public void onResumeGame(GameId gameId) {
        eventBus.fire(new ResumeGameEvent(gameId));
    }
}
