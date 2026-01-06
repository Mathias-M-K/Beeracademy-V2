package dk.mathiaskofod.domain.game;

import dk.mathiaskofod.domain.game.deck.models.Card;
import dk.mathiaskofod.domain.game.events.emitter.GameEventEmitter;
import dk.mathiaskofod.domain.game.deck.Deck;
import dk.mathiaskofod.domain.game.exceptions.GameException;
import dk.mathiaskofod.domain.game.exceptions.GameNotStartedException;
import dk.mathiaskofod.domain.game.models.Chug;
import dk.mathiaskofod.domain.game.models.Turn;
import dk.mathiaskofod.domain.game.player.Player;

import dk.mathiaskofod.domain.game.timer.GameTimer;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;

import java.time.Duration;
import java.util.List;

@Slf4j
public class GameImpl implements Game {

    @Getter
    private final String name;

    @Getter
    private final String gameId;

    @Getter
    private final List<Player> players;

    @Getter
    private Player currentPlayer;
    private Player previousPlayer;
    private Player nextPlayer;

    private int currentPlayerIndex;
    private final GameTimer playerTimer;

    private boolean isStarted = false;
    private boolean awaitingChug = false;
    private final GameTimer gameTimer;
    private int round = 1;
    private final Deck deck;

    GameEventEmitter eventEmitter;

    public GameImpl(String name, String gameId, List<Player> players, GameEventEmitter eventEmitter) {
        this.name = name;
        this.gameId = gameId;
        this.players = players;

        this.currentPlayer = players.getFirst();
        this.currentPlayerIndex = 0;
        this.deck = new Deck(players.size());

        this.eventEmitter = eventEmitter;

        gameTimer = new GameTimer();
        playerTimer = new GameTimer();
    }

    public void startGame() {
        isStarted = true;

        gameTimer.start();
        playerTimer.start();

        eventEmitter.onStartGame(gameId);
    }

    public void endGame() {
        eventEmitter.onEndGame(gameId, gameTimer.getTime());
        //TODO implement end logic
    }

    public void pauseGame() {
        log.info("Pausing game: {}", gameId);
        eventEmitter.onPauseGame(gameId);

        gameTimer.pause();
        playerTimer.pause();
    }

    public void resumeGame() {
        log.info("Resuming game: {}", gameId);
        eventEmitter.onResumeGame(gameId);

        gameTimer.resume();
        playerTimer.resume();
    }

    public void drawCard(long clientDurationMillis) {

        if (!isStarted) {
            throw new GameNotStartedException(gameId);
        }

        if(awaitingChug){
            throw new GameException("Cannot draw a card while awaiting chug response",400);
        }

        //TODO implement client-side check for time
        Duration clientTime = Duration.ofMillis(clientDurationMillis);
        Duration playerTime = round == 1 ? Duration.ofMinutes(0) : clientTime;

        Turn turn = new Turn(round, deck.drawCard(), playerTime);
        currentPlayer.stats().addTurn(turn);

        switchToNextPlayer();

        eventEmitter.onDrawCard(turn, previousPlayer, currentPlayer, nextPlayer, gameId);

        if (isChugCard(turn.card())) {
            awaitingChug = true;
            playerTimer.pause();
            return;
        }

        if (deck.isEmpty()) {
            endGame();
        }
    }

    public void registerChug(Chug chug) {

        if (!awaitingChug) {
            throw new GameException("No chug expected at this time", 400);
        }

        currentPlayer.stats().addChug(chug);
        awaitingChug = false;

        eventEmitter.onNewChug(chug, currentPlayer, gameId);

        playerTimer.resume();
    }

    /**
     * Advances to the next player and updates the current player index.
     */
    private void switchToNextPlayer() {

        previousPlayer = currentPlayer;

        currentPlayerIndex++;
        if (currentPlayerIndex > players.size() - 1) {
            round++;
            currentPlayerIndex = 0;
        }

        currentPlayer = players.get(currentPlayerIndex);
        playerTimer.reset();

        nextPlayer = peakNextPlayer();
    }

    /**
     * Peaks the next player without changing the current player index.
     *
     * @return The next player.
     */
    private Player peakNextPlayer() {
        int nextPlayerIndex = currentPlayerIndex + 1;
        if (nextPlayerIndex > players.size() - 1) {
            nextPlayerIndex = 0;
        }

        return players.get(nextPlayerIndex);
    }

    private boolean isChugCard(Card card) {
        return card.rank() == 14;
    }

}
