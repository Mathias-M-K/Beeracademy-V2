package dk.mathiaskofod.domain.game.events.emitter;

import dk.mathiaskofod.domain.game.events.*;
import dk.mathiaskofod.domain.game.models.Chug;
import dk.mathiaskofod.domain.game.models.Turn;
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
    public void onStartGame(String gameId) {
        eventBus.fire(new StartGameEvent(gameId));
    }

    @Override
    public void onEndGame(String gameId, Duration gameDuration) {
        eventBus.fire(new EndGameEvent(gameId, gameDuration));
    }

    @Override
    public void onPauseGame(String gameId) {
        eventBus.fire(new PauseGameEvent(gameId));
    }

    @Override
    public void onResumeGame(String gameId) {
        eventBus.fire(new ResumeGameEvent(gameId));
    }

    @Override
    public void onDrawCard(Turn turn, Player previousPlayer, Player newPlayer, Player nextPlayer, String gameId) {
        eventBus.fire(new DrawCardEvent(turn, previousPlayer, newPlayer, nextPlayer, gameId));
    }

    @Override
    public void onNewChug(Chug chug, Player player, String gameId) {
        eventBus.fire(new ChugEvent(chug,player, gameId));
    }
}
