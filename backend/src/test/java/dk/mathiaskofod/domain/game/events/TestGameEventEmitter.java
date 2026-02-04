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

    /**
     * Invoked when a game starts; no-op test implementation.
     *
     * @param game the Game that has started
     */
    @Override
    public void onStartGame(Game game) {
        //Right now, only exist as a "Mock"
    }

    /**
     * No-op handler invoked when a game ends; provided as a test stub with no side effects.
     *
     * @param game the game that has ended
     */
    @Override
    public void onEndGame(Game game) {
        //Right now, only exist as a "Mock"
    }

    /**
     * No-op handler invoked when a game is paused, used as a test stub.
     *
     * @param game the game that was paused
     */
    @Override
    public void onPauseGame(Game game) {
        //Right now, only exist as a "Mock"
    }

    /**
     * No-op handler invoked when a game is resumed (test stub).
     *
     * @param game the resumed Game instance
     */
    @Override
    public void onResumeGame(Game game) {
        //Right now, only exist as a "Mock"
    }

    /**
     * No-op handler invoked when a card is drawn during a turn.
     *
     * <p>This test implementation intentionally performs no action; it exists as a stubbed
     * GameEventEmitter for use in tests where event emission must be present but side effects
     * are undesired.
     *
     * @param turn the current turn in which the card was drawn
     * @param previousPlayer the player who acted before the draw
     * @param newPlayer the player who drew the card
     * @param nextPlayer the player who is next to act after the draw
     * @param game the game in which the event occurred
     */
    @Override
    public void onDrawCard(Turn turn, Player previousPlayer, Player newPlayer, Player nextPlayer, Game game) {
        //Right now, only exist as a "Mock"
    }


    /**
     * No-op test implementation invoked when a new chug is created in a game.
     *
     * @param chug      the created Chug instance
     * @param chugger   the player who initiated the chug
     * @param nextPlayer the player who is next to act after the chug
     * @param game      the Game in which the chug occurred
     */
    @Override
    public void onNewChug(Chug chug, Player chugger, Player nextPlayer, Game game) {
        //Right now, only exist as a "Mock"
    }

}
