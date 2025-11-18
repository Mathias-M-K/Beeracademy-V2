package dk.mathiaskofod.domain.game;

import dk.mathiaskofod.domain.game.events.emitter.GameEventEmitter;
import dk.mathiaskofod.domain.game.deck.Deck;
import dk.mathiaskofod.domain.game.exceptions.GameNotStartedException;
import dk.mathiaskofod.domain.game.models.GameId;
import dk.mathiaskofod.domain.game.deck.models.Card;
import dk.mathiaskofod.domain.game.models.Chug;
import dk.mathiaskofod.domain.game.models.Turn;
import dk.mathiaskofod.domain.game.player.Player;

import lombok.Getter;
import lombok.extern.slf4j.Slf4j;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

@Slf4j
public class GameImpl implements Game{

    @Getter
    private final String name;

    @Getter
    private final GameId gameId;

    @Getter
    private final List<Player> players;

    @Getter
    private Player currentPlayer;

    private int currentPlayerIndex;
    private Instant currentPlayerStartTime;

    private boolean isStarted = false;
    private Instant gameStartTime;
    private int round = 1;
    private final Deck deck;

    GameEventEmitter eventEmitter;

    public GameImpl(String name, GameId gameId, List<Player> players, GameEventEmitter eventEmitter) {
        this.name = name;
        this.gameId = gameId;
        this.players = players;

        this.currentPlayer = players.getFirst();
        this.currentPlayerIndex = 0;
        this.deck = new Deck(players.size());

        this.eventEmitter = eventEmitter;
    }

    public void startGame() {
        isStarted = true;
        gameStartTime = Instant.now();
        currentPlayerStartTime = Instant.now();

        eventEmitter.onStartGame(gameId);
    }

    public void endGame(){

        eventEmitter.onEndGame(gameId, getElapsedGameTime());
    }

    private Card drawCard(){
        return deck.drawCard();
    }

    private Duration getElapsedGameTime() {
        if (!isStarted) {
            throw new GameNotStartedException(gameId);
        }
        return Duration.between(gameStartTime, Instant.now());
    }

    public void endTurn(long clientDurationMillis){
        endTurn(clientDurationMillis,null);
    }

    public void endTurn(long clientDurationMillis, Chug chug) {

        if (!isStarted) {
            throw new GameNotStartedException(gameId);
        }

        if(chug != null){
            currentPlayer.stats().addChug(chug);
            eventEmitter.onNewChug(chug, currentPlayer, gameId);
        }

        //TODO research this. Like what do we do with duration and sync
        Duration serverTime = Duration.between(currentPlayerStartTime, Instant.now());
        Duration clientTime = Duration.ofMillis(clientDurationMillis);
        Duration clientDiff = Duration.ofMillis(clientDurationMillis - serverTime.toMillis());
        Duration playerTime = round == 1 ? Duration.ofMinutes(0) : clientTime;

        log.info("Client diff from server duration: {} millis", clientDiff.toMillis());

        Turn endedTurn = new Turn(round, drawCard(), playerTime);
        currentPlayer.stats().addTurn(endedTurn);

        Player previousPlayer = currentPlayer;
        currentPlayer = getNextPlayer();
        Player nextPlayer = peakNextPlayer();

        currentPlayerStartTime = Instant.now();

        eventEmitter.onEndOfTurn(endedTurn, previousPlayer, currentPlayer, nextPlayer, gameId);
    }

    private Player getNextPlayer() {
        currentPlayerIndex++;
        if (currentPlayerIndex > players.size() - 1) {
            round++;
            currentPlayerIndex = 0;
        }

        return players.get(currentPlayerIndex);
    }

    /**
     * Peaks the next player without changing the current player index.
     * @return The next player.
     */
    private Player peakNextPlayer() {
        int nextPlayerIndex = currentPlayerIndex + 1;
        if (nextPlayerIndex > players.size() - 1) {
            nextPlayerIndex = 0;
        }

        return players.get(nextPlayerIndex);
    }
}
