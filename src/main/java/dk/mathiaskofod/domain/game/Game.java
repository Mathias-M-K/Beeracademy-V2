package dk.mathiaskofod.domain.game;

import dk.mathiaskofod.domain.game.models.GameId;
import dk.mathiaskofod.domain.game.player.Player;

import java.util.List;

public interface Game {

    String getName();

    GameId getGameId();

    /**
     * Starts the game by starting the timer for both the game and the first player
     */
    void startGame();

    /**
     * Ends the game, stopping all timers and finalizing the game state
     */
    void endGame();

    /**
     * Ends the current turn for a specific player and starts the next player's turn
     * @param duration the duration of the turn in milliseconds
     */
    void drawCard(long duration);


    /**
     * Gets the list of players in the game
     * @return the list of players
     */
    List<Player> getPlayers();

    /**
     * Gets the current player whose turn it is
     * @return the current player
     */
    Player getCurrentPlayer();
}
