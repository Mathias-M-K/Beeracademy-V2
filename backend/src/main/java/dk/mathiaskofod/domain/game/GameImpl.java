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

    /**
     * Create a new GameImpl and initialize core game state, turn order, deck, and timers.
     *
     * @param name         the game name
     * @param gameId       the unique identifier for this game
     * @param players      the ordered list of players; the first player becomes the starting/current player
     * @param eventEmitter the event emitter used to publish game lifecycle and action events
     */
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

    /**
     * Transitions the game into the IN_PROGRESS state, starts the game and player timers,
     * and notifies listeners that the game has started.
     *
     * If the game is already in progress this method has no effect.
     */
    public void startGame() {

        if (gameState == GameState.IN_PROGRESS) {
            return;
        }

        gameState = GameState.IN_PROGRESS;

        gameTimer.start();
        playerTimer.start();

        eventEmitter.onStartGame(this);
    }

    /**
     * End the game and finalize its state.
     *
     * Pauses both game and player timers, sets the game state to FINISHED, and emits the end-game event.
     */
    public void endGame() {

        if (gameState == GameState.FINISHED) {
            return;
        }

        gameTimer.pause();
        playerTimer.pause();

        gameState = GameState.FINISHED;

        eventEmitter.onEndGame(this);
    }

    /**
     * Pause the game, stopping both the overall game timer and the active player's timer.
     *
     * Pauses the game and player timers and emits an onPauseGame event for this game instance.
     */
    public void pauseGame() {

        gameTimer.pause();
        playerTimer.pause();

        eventEmitter.onPauseGame(this);
    }

    /**
     * Resume the game's timers and notify listeners that the game has resumed.
     *
     * Resumes the overall game timer, conditionally resumes the active player's timer when a chug response is not pending,
     * and emits an onResumeGame event for this game instance.
     */
    public void resumeGame() {
        gameTimer.resume();

        if (!awaitingChug) {
            playerTimer.resume();
        }


        eventEmitter.onResumeGame(this);
    }

    /**
     * Processes the current player's card draw: records the drawn card and turn time, advances or changes turn order, initiates chug handling when required, and ends the game if the deck is exhausted.
     *
     * @param clientDurationMillis the client's measured active player duration in milliseconds; used to compare against the server timer and determine the turn's registered time (registered time is 0 for round 1)
     * @throws GameException if the game is not in progress, the game timer is paused, or a chug response is currently awaited
     */
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

        long clientServerDiff = Math.abs(clientDurationMillis - playerTimer.getActiveDuration().toMillis());
        log.info("Client reported duration: {} ms, Server recorded duration: {} ms, diff: {}", clientDurationMillis, playerTimer.getActiveDuration().toMillis(), clientServerDiff);
        Duration serverTime = playerTimer.getActiveDuration();
        Duration registeredTime = round == 1 ? Duration.ofMinutes(0) : serverTime;

        lastCard = deck.drawCard();
        Turn turn = new Turn(round, lastCard, registeredTime.toMillis());
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
            playerTimer.reset(true);
            return;
        }

        if (deck.isEmpty()) {
            endGame();
        }
    }

    /**
     * Register the given chug for the active player, resume play, and advance to the next player.
     *
     * Records the chug in the current player's statistics, resumes the player timer, emits a
     * new-chug event, and advances turn order.
     *
     * @param chug the chug response to record for the current player
     * @throws GameException if no chug is expected at this time (400)
     * @throws GameException if the game is paused and a chug cannot be registered (400)
     */
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

    /**
     * Determines whether the given card is a chug card.
     *
     * @param card the card to check
     * @return `true` if the card's rank equals 14 (chug card), `false` otherwise
     */
    private boolean isChugCard(Card card) {
        return card.rank() == 14;
    }

    /**
     * Accesses the timer that tracks the overall game duration.
     *
     * @return the game's overall {@code Timer}
     */
    public Timer getGameTimer() {
        return gameTimer;
    }

    /**
     * Access the timer that tracks the active player's remaining time.
     *
     * @return the Timer instance used to measure and control the current player's time
     */
    public Timer getPlayerTimer() {
        return playerTimer;
    }

}