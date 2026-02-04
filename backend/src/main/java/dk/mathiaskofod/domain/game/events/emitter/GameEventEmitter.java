package dk.mathiaskofod.domain.game.events.emitter;

import dk.mathiaskofod.domain.game.Game;
import dk.mathiaskofod.domain.game.models.Chug;
import dk.mathiaskofod.domain.game.models.Turn;
import dk.mathiaskofod.domain.game.player.Player;

public interface GameEventEmitter {

    /**
 * Notify listeners that a game has started.
 *
 * @param game the game that has started
 */
void onStartGame(Game game);

    /**
 * Notify listeners that a game has ended.
 *
 * Invoked when the specified game finishes so implementors can react to the end-of-game event.
 *
 * @param game the finished game
 */
void onEndGame(Game game);

    /**
 * Notify listeners that a game has been paused.
 *
 * @param game the game instance that was paused
 */
void onPauseGame(Game game);

    /**
 * Notify listeners that a game has been resumed.
 *
 * @param game the game instance that was resumed
 */
void onResumeGame(Game game);

    /**
 * Notify listeners that a card draw occurred in the specified turn.
 *
 * @param turn the current turn during which the draw happened
 * @param previousPlayer the player who drew from the previous position
 * @param newPlayer the player who will take the next turn after the draw
 * @param nextPlayer the player who is next after the draw
 * @param game the game in which the draw event occurred
 */
void onDrawCard(Turn turn, Player previousPlayer, Player newPlayer, Player nextPlayer, Game game);

    /**
 * Notifies listeners that a new Chug event occurred in the specified game.
 *
 * @param chug       the Chug instance involved in the event
 * @param chugger    the player who performed the chug
 * @param nextPlayer the player who will act next after the chug
 * @param game       the game in which the chug event occurred
 */
void onNewChug(Chug chug, Player chugger, Player nextPlayer, Game game);
}