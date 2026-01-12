package dk.mathiaskofod.domain.game.events.emitter;

import dk.mathiaskofod.domain.game.events.*;
import dk.mathiaskofod.domain.game.models.Chug;
import dk.mathiaskofod.domain.game.models.Turn;
import dk.mathiaskofod.domain.game.player.Player;
import dk.mathiaskofod.domain.game.timer.models.TimeReport;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Event;
import jakarta.inject.Inject;

@ApplicationScoped
public class GameEventEmitterImpl implements GameEventEmitter {

    @Inject
    Event<GameEvent> eventBus;


    @Override
    public void onStartGame(String gameId) {
        eventBus.fire(new StartGameEvent(gameId));
    }

    @Override
    public void onEndGame(String gameId, TimeReport timeReport) {
        eventBus.fire(new EndGameEvent(gameId, timeReport));
    }

    @Override
    public void onPauseGame(String gameId, TimeReport timeReport) {
        eventBus.fire(new PauseGameEvent(gameId, timeReport));
    }

    @Override
    public void onResumeGame(String gameId, TimeReport timeReport) {
        eventBus.fire(new ResumeGameEvent(gameId, timeReport));
    }

    @Override
    public void onDrawCard(Turn turn, Player previousPlayer, Player newPlayer, Player nextPlayer, String gameId) {
        eventBus.fire(new DrawCardEvent(turn, previousPlayer, newPlayer, nextPlayer, gameId));
    }

    @Override
    public void onNewChug(Chug chug, Player chugger, Player newPlayer, String gameId) {
        eventBus.fire(new ChugEvent(chug, chugger, newPlayer, gameId));
    }
}
