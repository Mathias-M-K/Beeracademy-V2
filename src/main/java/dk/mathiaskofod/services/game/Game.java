package dk.mathiaskofod.services.game;

import dk.mathiaskofod.services.common.exceptions.NoConnectionIdException;
import dk.mathiaskofod.services.common.models.ConnectionInfo;
import dk.mathiaskofod.services.game.event.GameEventEmitter;
import dk.mathiaskofod.services.game.exceptions.game.GameNotStartedException;
import dk.mathiaskofod.services.game.id.generator.models.GameId;
import dk.mathiaskofod.services.game.models.Card;
import dk.mathiaskofod.services.game.models.Chug;
import dk.mathiaskofod.services.game.models.Turn;
import dk.mathiaskofod.services.player.models.Player;

import lombok.Getter;
import lombok.extern.slf4j.Slf4j;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

@Slf4j
public class Game {

    @Getter
    private final String name;

    @Getter
    private final GameId gameId;

    @Getter
    private final List<Player> players;

    @Getter
    private final ConnectionInfo connectionInfo;

    private boolean isStarted = false;
    private Instant gameStartTime;
    private int round = 1;
    private final Deck deck;

    @Getter
    private Player currentPlayer;
    private int currentPlayerIndex;
    private Instant currentPlayerStartTime;

    GameEventEmitter eventEmitter;

    public Game(String name, GameId gameId, List<Player> players, GameEventEmitter eventEmitter) {
        this.name = name;
        this.gameId = gameId;
        this.players = players;
        this.connectionInfo = new ConnectionInfo();

        this.currentPlayer = players.getFirst();
        this.currentPlayerIndex = 0;
        this.deck = new Deck(players.size());

        this.eventEmitter = eventEmitter;
    }

    public void startGame() {
        isStarted = true;
        gameStartTime = Instant.now();
        currentPlayerStartTime = Instant.now();
    }

    private Card drawCard(){
        return deck.drawCard();
    }

    public Duration getElapsedGameTime() {
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

        //TODO research this. Like what do we do with time and sync
        Duration serverTime = Duration.between(currentPlayerStartTime, Instant.now());
        Duration clientTime = Duration.ofMillis(clientDurationMillis);
        Duration clientDiff = Duration.ofMillis(clientDurationMillis - serverTime.toMillis());
        Duration playerTime = round == 1 ? Duration.ofMinutes(0) : clientTime;

        log.info("Client diff from server time: {} millis", clientDiff.toMillis());

        Card card = drawCard();
        Turn turn = new Turn(round, card, playerTime);
        currentPlayer.stats().addTurn(turn);

        if(chug != null){
            currentPlayer.stats().addChug(chug);
        }

        progressGame();

        eventEmitter.onEndOfTurn(playerTime,card,currentPlayer, gameId);
    }

    private void progressGame() {
        currentPlayer = getNextPlayer();
        currentPlayerStartTime = Instant.now();
    }

    private Player getNextPlayer() {
        currentPlayerIndex++;
        if (currentPlayerIndex > players.size() - 1) {
            round++;
            currentPlayerIndex = 0;
        }

        return players.get(currentPlayerIndex);
    }


}
