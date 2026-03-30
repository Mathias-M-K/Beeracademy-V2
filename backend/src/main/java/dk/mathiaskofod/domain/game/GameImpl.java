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

import java.util.LinkedList;
import java.util.List;
import java.util.Queue;

//TODO consider decorator pattern to remove the eventEmitter from GameImpl
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
    private final Queue<Player> playerQueue;

    @Getter
    private Player nextToDraw;

    @Getter
    private Player drawnBy;

    @Getter
    private Player nextAfter;

    @Getter
    private Card lastCardDrawn;

    @Getter
    private int turnCounter = 1;
    int round = 1;

    @Getter
    private final Timer playerTimer;

    @Getter
    private final Timer gameTimer;

    @Getter
    private final Deck deck;

    GameEventEmitter eventEmitter;

    public GameImpl(String name, String gameId, List<Player> players, GameEventEmitter eventEmitter) {
        this.name = name;
        this.gameId = gameId;
        this.players = players;
        this.playerQueue = new LinkedList<>(players);

        this.nextToDraw = playerQueue.poll();
        this.nextAfter = playerQueue.peek();

        this.deck = new Deck(players.size());

        gameTimer = new Timer();
        playerTimer = new Timer();

        this.eventEmitter = eventEmitter;
    }

    public GameImpl(GameSnapshot snapshot, GameEventEmitter eventEmitter) {
        this.name = snapshot.name();
        this.gameId = snapshot.gameId();
        this.players = snapshot.players();

        LinkedList<Player> restoredQueue = new LinkedList<>(snapshot.playerQueue());

        this.drawnBy    = restoredQueue.getLast();
        this.nextToDraw = restoredQueue.getFirst();
        this.nextAfter  = restoredQueue.get(1);

        this.playerQueue = restoredQueue;

        this.gameTimer = new Timer(snapshot.gameTimer());
        this.playerTimer = new Timer(snapshot.playerTimer());

        this.deck = new Deck(snapshot.deck());

        this.gameState = snapshot.gameState();
        this.turnCounter = snapshot.turnCounter();

        this.eventEmitter = eventEmitter;
    }

    public void startGame() {

        if (gameState != GameState.AWAITING_START) {
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

        gameState = GameState.FINISHED;

        gameTimer.pause();
        playerTimer.pause();

        eventEmitter.onEndGame(this);
    }

    public void pauseGame() {

        gameTimer.pause();
        playerTimer.pause();

        eventEmitter.onPauseGame(this);
    }

    public void resumeGame() {

        if (gameState == GameState.FINISHED) {
            throw new GameException("Cannot resume a finished game", 400);
        }

        gameTimer.resume();

        if (gameState != GameState.AWAITING_CHUG) {
            playerTimer.resume();
        }


        eventEmitter.onResumeGame(this);
    }

    public void drawCard(long turnDuration) {

        if (gameState != GameState.IN_PROGRESS) {
            throw new GameException(String.format("Draw card not available when game is not in state: %s", GameState.IN_PROGRESS), 400);
        }

        if (gameTimer.getState() == TimerState.PAUSED) {
            throw new GameException("Can't draw card while game is paused", 400);
        }

        progressPlayerQueue();

        lastCardDrawn = deck.drawCard();

        //If first round, then time is set to zero, as players are just beginning
        long duration = round == 1 ? 0 : turnDuration;
        Turn turn = new Turn(round, lastCardDrawn, duration);
        drawnBy.stats().addTurn(turn);

        eventEmitter.onDrawCard(turn, drawnBy, nextToDraw, nextAfter, this);

        if (isChugCard(turn.card())) {
            gameState = GameState.AWAITING_CHUG;
            playerTimer.pause();
            playerTimer.reset();
            return;
        }

        if (deck.isEmpty()) {
            endGame();
        }
    }

    public void registerChug(Chug chug) {

        if (gameState !=  GameState.AWAITING_CHUG) {
            throw new GameException("No chug expected at this time", 400);
        }

        if (gameTimer.getState() == TimerState.PAUSED) {
            throw new GameException("Can't register a chug while game is paused", 400);
        }

        drawnBy.stats().addChug(chug);
        gameState = GameState.IN_PROGRESS;

        playerTimer.resume();

        eventEmitter.onNewChug(chug, drawnBy, nextToDraw, this);
    }

    /**
     * Switches to the next nextToDraw in the queue, resets the nextToDraw timer, updates the previous and next nextToDraw references and adds the current nextToDraw to the end of the queue.
     */
    private void progressPlayerQueue() {

        playerTimer.reset();
        drawnBy = nextToDraw;

        playerQueue.add(drawnBy);
        nextToDraw = playerQueue.poll();

        nextAfter = playerQueue.peek();

        turnCounter++;
        if (turnCounter % players.size() == 0) {
            round++;
        }
    }

    private boolean isChugCard(Card card) {
        return card.rank() == 14;
    }

}
