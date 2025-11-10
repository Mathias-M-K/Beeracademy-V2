package dk.mathiaskofod.services.game;

import dk.mathiaskofod.services.game.exceptions.GameNotStartedException;
import dk.mathiaskofod.services.game.game.id.generator.models.GameId;
import dk.mathiaskofod.services.game.models.Suit;
import dk.mathiaskofod.services.game.models.Turn;
import dk.mathiaskofod.services.player.models.Player;

import lombok.Getter;

import java.time.Duration;
import java.time.Instant;
import java.util.List;


public class Game {

    @Getter
    private final String name;

    @Getter
    private final GameId gameId;

    @Getter
    private final List<Player> players;

    private boolean isStarted = false;
    private Instant gameStartTime;
    private int round;
    private Deck deck;

    private int currentPlayerIndex;
    Player currentPlayer;
    private Instant currentPlayerStartTime;

    public Game(String name, GameId gameId, List<Player> players) {
        this.name = name;
        this.gameId = gameId;
        this.players = players;

        this.currentPlayer = players.getFirst();
        this.currentPlayerIndex = 0;
        this.round = 0;
        this.deck = new Deck(players.size());
    }

    public void startGame(){
        isStarted = true;
        gameStartTime = Instant.now();
    }

    public Duration getElapsedGameTime(){
        if(!isStarted){
            throw new GameNotStartedException(gameId);
        }
        return Duration.between(gameStartTime,Instant.now());
    }

    public void endTurn(int clientDurationMillis){
        Duration serverTime = Duration.between(currentPlayerStartTime,Instant.now());
        Duration clientTime = Duration.ofMillis(clientDurationMillis);

        serverTime.compareTo(clientTime);

        Turn turn = new Turn(round, Suit.club, 5, serverTime);
        currentPlayer.stats().turns().add(turn);

        progressGame();
    }

    void progressGame(){
        currentPlayer = getNextPlayer();
        currentPlayerStartTime = Instant.now();
    }

    private Player getNextPlayer(){
        currentPlayerIndex++;
        if (currentPlayerIndex > players.size()-1){
            round++;
            currentPlayerIndex = 0;
        }

        return players.get(currentPlayerIndex);
    }



}
