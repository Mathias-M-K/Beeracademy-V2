package dk.mathiaskofod.domain.game;

import dk.mathiaskofod.domain.game.deck.Deck;
import dk.mathiaskofod.domain.game.deck.models.Card;
import dk.mathiaskofod.domain.game.events.emitter.GameEventEmitter;
import dk.mathiaskofod.domain.game.exceptions.GameException;
import dk.mathiaskofod.domain.game.models.Chug;
import dk.mathiaskofod.domain.game.models.GameState;
import dk.mathiaskofod.domain.game.models.Turn;
import dk.mathiaskofod.domain.game.player.Player;
import dk.mathiaskofod.domain.game.timer.Timer;
import dk.mathiaskofod.domain.game.timer.models.TimerState;
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
    private GameState gameState = GameState.AWAITING_START;

    @Getter
    private final List<Player> players;

    @Getter
    private Player currentPlayer;

    @Getter
    private Player previousPlayer;

    @Getter
    private Player nextPlayer;

    @Getter
    private Card lastCard;

    private int currentPlayerIndex;
    private final Timer playerTimer;

    private boolean awaitingChug = false;
    private final Timer gameTimer;
    private int round = 1;
    private final Deck deck;

    GameEventEmitter eventEmitter;

    public GameImpl(String name, String gameId, List<Player> players, GameEventEmitter eventEmitter) {
        this.name = name;
        this.gameId = gameId;
        this.players = players;

        this.currentPlayer = players.getFirst();
        this.currentPlayerIndex = 0;
        this.nextPlayer = peakNextPlayer();
        this.deck = new Deck(players.size());

        this.eventEmitter = eventEmitter;

        gameTimer = new Timer();
        playerTimer = new Timer();
    }

    public void startGame() {

        if (gameState == GameState.IN_PROGRESS) {
            return;
        }

        gameState = GameState.IN_PROGRESS;

        gameTimer.start();
        playerTimer.start();

        eventEmitter.onStartGame(this);
    }

    public void endGame() {

        if (gameState == GameState.FINISHED) {
            return;
        }

        gameTimer.pause();
        playerTimer.pause();

        gameState = GameState.FINISHED;

        eventEmitter.onEndGame(this);
    }

    public void pauseGame() {

        gameTimer.pause();
        playerTimer.pause();

        eventEmitter.onPauseGame(this);
    }

    public void resumeGame() {
        gameTimer.resume();
        playerTimer.resume();

        eventEmitter.onResumeGame(this);
    }

    public void drawCard(long clientDurationMillis) {

        if (gameState != GameState.IN_PROGRESS) {
            throw new GameException(String.format("Draw card not available when game is not in state: %s", GameState.IN_PROGRESS), 400);
        }

        if (gameTimer.getState() == TimerState.PAUSED) {
            throw new GameException("Can't draw card while game is paused", 400);
        }

        if (awaitingChug) {
            throw new GameException("Cannot draw a card while awaiting chug response", 400);
        }

        //TODO implement client-side check for time
        Duration clientTime = playerTimer.getActiveDuration();
        Duration playerTime = round == 1 ? Duration.ofMinutes(0) : clientTime;

        lastCard = deck.drawCard();
        Turn turn = new Turn(round, lastCard, playerTime.toMillis());
        currentPlayer.stats().addTurn(turn);

        if (!isChugCard(lastCard)) {
            switchToNextPlayer();
        } else {
            previousPlayer = currentPlayer;
        }

        eventEmitter.onDrawCard(turn, previousPlayer, currentPlayer, nextPlayer, this);

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

        if (gameTimer.getState() == TimerState.PAUSED) {
            throw new GameException("Can't register a chug while game is paused", 400);
        }

        currentPlayer.stats().addChug(chug);
        awaitingChug = false;


        playerTimer.resume();

        eventEmitter.onNewChug(chug, currentPlayer, nextPlayer, this);

        switchToNextPlayer();
    }

    /**
     * Advances to the next player and updates the current player index.
     */
    private void switchToNextPlayer() {

        playerTimer.reset();
        previousPlayer = currentPlayer;

        currentPlayerIndex++;
        if (currentPlayerIndex > players.size() - 1) {
            round++;
            currentPlayerIndex = 0;
        }

        currentPlayer = players.get(currentPlayerIndex);

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

    public Timer getGameTimer() {
        return gameTimer;
    }

    public Timer getPlayerTimer() {
        return playerTimer;
    }

}
