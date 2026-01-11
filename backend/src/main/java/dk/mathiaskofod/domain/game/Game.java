package dk.mathiaskofod.domain.game;

import dk.mathiaskofod.domain.game.deck.models.Card;
import dk.mathiaskofod.domain.game.models.Chug;
import dk.mathiaskofod.domain.game.player.Player;

import java.util.List;

public interface Game {

    /**
     * Gets the user chosen name for the game
     * @return the game name
     */
    String getName();

    /**
     * Gets the unique identifier for the game
     * @return the game ID
     */
    String getGameId();

    /**
     * Starts the game by starting the timer for both the game and the first player
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
     * @param duration the duration of the turn in milliseconds
     */
    void drawCard(long duration);

    /**
     * Registers a chug event in the game
     * @param chug the chug event to register
     */
    void registerChug(Chug chug);

    Card getLastCard();

    /**
     * Returns a list of players in the game
     * @return a list of players
     */
    List<Player> getPlayers();

    /**
     * Returns the current player in turn
     * @return the current player
     */
    Player getCurrentPlayer();

    /**
     * Returns the next player
     * @return next player
     */
    Player getNextPlayer();

    /**
     * Returns the previous player
     * @return previous player
     */
    Player getPreviousPlayer();
}
