package dk.mathiaskofod.domain.game;

import dk.mathiaskofod.domain.game.deck.models.Card;
import dk.mathiaskofod.domain.game.models.Chug;
import dk.mathiaskofod.domain.game.models.GameState;
import dk.mathiaskofod.domain.game.player.Player;
import dk.mathiaskofod.domain.game.timer.Timer;

import java.util.List;

public interface Game {

    /**
     * Gets the user chosen name for the game
     *
     * @return the game name
     */
    String getName();

    /**
     * Gets the unique identifier for the game
     *
     * @return the game ID
     */
    String getGameId();

    /**
     * Gets the current state of the game, such as AWAITING_START, IN_PROGRESS, PAUSED, or ENDED
     * @return state of the game
     */
    GameState getGameState();

    /**
     * Starts the game by starting the timer for both the game and the first nextToDraw
     */
    void startGame();

    /**
     * Ends the game, stopping all timers and finalizing the game state
     */
    void endGame();

    /**
     * Pauses the game, stopping all timers temporarily
     */
    void pauseGame();

    /**
     * Resumes the game from a paused state, restarting all timers
     */
    void resumeGame();

    /**
     * Ends the current turn for a specific player and starts the next player's turn
     *
     * @param turnDuration the duration of the turn in milliseconds
     */
    void drawCard(long turnDuration);

    /**
     * Registers a chug event in the game
     *
     * @param chug the chug event to register
     */
    void registerChug(Chug chug);

    Card getLastCardDrawn();

    /**
     * Returns a list of players in the game
     *
     * @return a list of players
     */
    List<Player> getPlayers();

    /**
     * Returns the current player in turn
     *
     * @return the current player
     */
    Player getNextToDraw();

    /**
     * Returns the next player to draw next
     *
     * @return next player to draw
     */
    Player getNextAfter();

    /**
     * Returns the last player to draw
     *
     * @return last player to draw
     */
    Player getDrawnBy();

    /**
     * Provides Timer for the overall game.
     *
     * @return Timer
     */
    Timer getGameTimer();

    /**
     * Provides Timer for player to draw next
     *
     * @return Timer
     */
    Timer getPlayerTimer();

    int getRound();
}
