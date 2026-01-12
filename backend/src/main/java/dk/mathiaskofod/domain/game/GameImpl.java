package dk.mathiaskofod.domain.game;

import dk.mathiaskofod.domain.game.deck.models.Card;
import dk.mathiaskofod.domain.game.events.emitter.GameEventEmitter;
import dk.mathiaskofod.domain.game.deck.Deck;
import dk.mathiaskofod.domain.game.exceptions.GameException;
import dk.mathiaskofod.domain.game.models.Chug;
import dk.mathiaskofod.domain.game.models.GameState;
import dk.mathiaskofod.domain.game.models.Turn;
import dk.mathiaskofod.domain.game.player.Player;

import dk.mathiaskofod.domain.game.timer.GameTimer;
import dk.mathiaskofod.domain.game.timer.models.TimeReport;
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
    private final GameTimer playerTimer;

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
        this.nextPlayer = peakNextPlayer();
        this.deck = new Deck(players.size());

        this.eventEmitter = eventEmitter;

        gameTimer = new GameTimer();
        playerTimer = new GameTimer();
    }

    public void startGame() {

        if (gameState == GameState.IN_PROGRESS) {
            return;
        }

        gameState = GameState.IN_PROGRESS;

        gameTimer.start();
        playerTimer.start();

        eventEmitter.onStartGame(gameId);
    }

    public void endGame() {
        if(gameState == GameState.FINISHED){
            return;
        }

        gameState = GameState.FINISHED;
        eventEmitter.onEndGame(gameId, gameTimer.getReport());
        //TODO implement end logic
    }

    public void pauseGame() {
        log.info("Pausing game: {}", gameId);

        gameTimer.pause();
        playerTimer.pause();

        eventEmitter.onPauseGame(gameId, gameTimer.getReport());
    }

    public void resumeGame() {
        gameTimer.resume();
        playerTimer.resume();

        eventEmitter.onResumeGame(gameId, gameTimer.getReport());
    }

    public void drawCard(long clientDurationMillis) {

        if (gameState != GameState.IN_PROGRESS) {
            throw new GameException(String.format("Draw card not avaiable when game is not in state: %s",GameState.IN_PROGRESS),400);
        }

        if (gameTimer.getState() == TimerState.PAUSED) {
            throw new GameException("Can't draw card while game is paused", 400);
        }

        if (awaitingChug) {
            throw new GameException("Cannot draw a card while awaiting chug response", 400);
        }

        //TODO implement client-side check for time
        log.info("PlayerTime: {}", playerTimer.getReport());
        Duration clientTime = playerTimer.getTime();
        Duration playerTime = round == 1 ? Duration.ofMinutes(0) : clientTime;

        lastCard = deck.drawCard();
        Turn turn = new Turn(round, lastCard, playerTime.toMillis());
        currentPlayer.stats().addTurn(turn);

        if (!isChugCard(lastCard)) {
            switchToNextPlayer();
        } else {
            previousPlayer = currentPlayer;
        }

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

        if (gameTimer.getState() == TimerState.PAUSED) {
            throw new GameException("Can't register a chug while game is paused", 400);
        }

        currentPlayer.stats().addChug(chug);
        awaitingChug = false;


        playerTimer.resume();

        eventEmitter.onNewChug(chug, currentPlayer, nextPlayer, gameId);

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

    public TimeReport getTimeReport() {
        return gameTimer.getReport();
    }

}
