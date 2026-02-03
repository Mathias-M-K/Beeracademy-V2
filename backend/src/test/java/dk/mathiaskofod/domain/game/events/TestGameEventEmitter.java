package dk.mathiaskofod.domain.game.events;

import dk.mathiaskofod.domain.game.Game;
import dk.mathiaskofod.domain.game.events.emitter.GameEventEmitter;
import dk.mathiaskofod.domain.game.models.Chug;
import dk.mathiaskofod.domain.game.models.Turn;
import dk.mathiaskofod.domain.game.player.Player;

/**
 * Test helper: a no-op implementation of {@link GameEventEmitter} that does nothing.
 * Place under src/test/java so it's only used by tests.
 */
public class TestGameEventEmitter implements GameEventEmitter {

    @Override
    public void onStartGame(Game game) {
        //Right now, only exist as a "Mock"
    }

    @Override
    public void onEndGame(Game game) {
        //Right now, only exist as a "Mock"
    }

    @Override
    public void onPauseGame(Game game) {
        //Right now, only exist as a "Mock"
    }

    @Override
    public void onResumeGame(Game game) {
        //Right now, only exist as a "Mock"
    }

    @Override
    public void onDrawCard(Turn turn, Player previousPlayer, Player newPlayer, Player nextPlayer, Game game) {
        //Right now, only exist as a "Mock"
    }


    @Override
    public void onNewChug(Chug chug, Player chugger, Player nextPlayer, Game game) {
        //Right now, only exist as a "Mock"
    }

}

