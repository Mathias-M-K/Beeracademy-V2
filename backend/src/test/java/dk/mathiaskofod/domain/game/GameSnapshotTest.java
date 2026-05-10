package dk.mathiaskofod.domain.game;

import dk.mathiaskofod.domain.game.events.emitter.GameEventEmitter;
import dk.mathiaskofod.domain.game.models.GameState;
import dk.mathiaskofod.domain.game.player.Player;
import dk.mathiaskofod.domain.game.timer.models.TimerState;
import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.*;
import static org.mockito.Mockito.mock;

@QuarkusTest
class GameSnapshotTest {

    private final GameEventEmitter gameEventEmitter = mock(GameEventEmitter.class);

    @Nested
    @DisplayName("Game state is correctly captured in snapshot")
    class GameStateIsCorrectlyCapturedInSnapshot {

        Game game;

        @BeforeEach
        void init(){
            List<Player> players = List.of(
                    Player.create("Player 1", 0, false),
                    Player.create("Player 2", 0, false)
            );
            game = new GameImpl("Game 1", "game-1", players, gameEventEmitter);
        }

        @Test
        @DisplayName("Snapshot should capture AWAITING_START state")
        void snapshotShouldCaptureAwaitingStartState(){

            //Act
            GameSnapshot snapshot = GameSnapshot.of(game);

            //Assert
            assertThat(snapshot.gameState(), is(GameState.AWAITING_START));
        }

        @Test
        @DisplayName("Snapshot should capture IN_PROGRESS state after start")
        void snapshotShouldCaptureInProgressStateAfterStart(){

            //Arrange
            game.startGame();

            //Act
            GameSnapshot snapshot = GameSnapshot.of(game);

            //Assert
            assertThat(snapshot.gameState(), is(GameState.IN_PROGRESS));
        }

        @Test
        @DisplayName("Snapshot should capture FINISHED state after end")
        void snapshotShouldCaptureFinishedStateAfterEnd(){

            //Arrange
            game.startGame();
            game.endGame();

            //Act
            GameSnapshot snapshot = GameSnapshot.of(game);

            //Assert
            assertThat(snapshot.gameState(), is(GameState.FINISHED));
        }
    }

    @Nested
    @DisplayName("Turn counter is correctly captured in snapshot")
    class TurnCounterIsCorrectlyCapturedInSnapshot {

        Game game;

        @BeforeEach
        void init(){
            List<Player> players = List.of(
                    Player.create("Player 1", 0, false),
                    Player.create("Player 2", 0, false)
            );
            game = new GameImpl("Game 1", "game-1", players, gameEventEmitter);
        }

        @Test
        @DisplayName("Snapshot should capture turn counter 0 for new game")
        void snapshotShouldCaptureTurnCounterZeroForNewGame(){

            //Act
            GameSnapshot snapshot = GameSnapshot.of(game);

            //Assert
            assertThat(snapshot.turnCounter(), is(0));
        }

        @Test
        @DisplayName("Snapshot should capture incremented turn counter after draws")
        void snapshotShouldCaptureIncrementedTurnCounterAfterDraws(){

            //Arrange
            game.startGame();
            game.drawCard(1000);
            game.drawCard(1000);

            //Act
            GameSnapshot snapshot = GameSnapshot.of(game);

            //Assert
            assertThat(snapshot.turnCounter(), is(2));
        }
    }

    @Nested
    @DisplayName("Last card is correctly captured in snapshot")
    class LastCardIsCorrectlyCapturedInSnapshot {

        Game game;

        @BeforeEach
        void init(){
            List<Player> players = List.of(
                    Player.create("Player 1", 0, false),
                    Player.create("Player 2", 0, false)
            );
            game = new GameImpl("Game 1", "game-1", players, gameEventEmitter);
        }

        @Test
        @DisplayName("Snapshot should capture null last card for new game")
        void snapshotShouldCaptureNullLastCardForNewGame(){

            //Act
            GameSnapshot snapshot = GameSnapshot.of(game);

            //Assert
            assertThat(snapshot.lastCard(), is(nullValue()));
        }

        @Test
        @DisplayName("Snapshot should capture last drawn card")
        void snapshotShouldCaptureLastDrawnCard(){

            //Arrange
            game.startGame();
            game.drawCard(1000);

            //Act
            GameSnapshot snapshot = GameSnapshot.of(game);

            //Assert
            assertThat(snapshot.lastCard(), is(notNullValue()));
        }
    }

    @Nested
    @DisplayName("Player order is correctly captured in snapshot")
    class PlayerOrderIsCorrectlyCapturedInSnapshot {

        Game game;

        @BeforeEach
        void init(){
            List<Player> players = List.of(
                    Player.create("Player 1", 0, false),
                    Player.create("Player 2", 0, false),
                    Player.create("Player 3", 0, false)
            );
            game = new GameImpl("Game 1", "game-1", players, gameEventEmitter);
        }

        @Test
        @DisplayName("Snapshot should capture player order")
        void snapshotShouldCapturePlayerOrder(){

            //Act
            GameSnapshot snapshot = GameSnapshot.of(game);

            //Assert
            assertThat(snapshot.playerOrder(), hasSize(3));
        }
    }

    @Nested
    @DisplayName("Player queue is correctly captured in snapshot")
    class PlayerQueueIsCorrectlyCapturedInSnapshot {

        Game game;

        @BeforeEach
        void init(){
            List<Player> players = List.of(
                    Player.create("Player 1", 0, false),
                    Player.create("Player 2", 0, false),
                    Player.create("Player 3", 0, false)
            );
            game = new GameImpl("Game 1", "game-1", players, gameEventEmitter);
        }

        @Test
        @DisplayName("Snapshot should capture player queue")
        void snapshotShouldCapturePlayerQueue(){

            //Act
            GameSnapshot snapshot = GameSnapshot.of(game);

            //Assert
            assertThat(snapshot.playerQueue(), hasSize(3));
        }
    }

    @Nested
    @DisplayName("Game timer is correctly captured in snapshot")
    class GameTimerIsCorrectlyCapturedInSnapshot {

        Game game;

        @BeforeEach
        void init(){
            List<Player> players = List.of(
                    Player.create("Player 1", 0, false),
                    Player.create("Player 2", 0, false)
            );
            game = new GameImpl("Game 1", "game-1", players, gameEventEmitter);
        }

        @Test
        @DisplayName("Snapshot should capture NOT_STARTED timer for new game")
        void snapshotShouldCaptureNotStartedTimerForNewGame(){

            //Act
            GameSnapshot snapshot = GameSnapshot.of(game);

            //Assert
            assertThat(snapshot.gameTimer().state(), is(TimerState.NOT_STARTED));
        }

        @Test
        @DisplayName("Snapshot should capture RUNNING timer after start")
        void snapshotShouldCaptureRunningTimerAfterStart(){

            //Arrange
            game.startGame();

            //Act
            GameSnapshot snapshot = GameSnapshot.of(game);

            //Assert
            assertThat(snapshot.gameTimer().state(), is(TimerState.RUNNING));
        }

        @Test
        @DisplayName("Snapshot should capture PAUSED timer after pause")
        void snapshotShouldCapturePausedTimerAfterPause(){

            //Arrange
            game.startGame();
            game.pauseGame();

            //Act
            GameSnapshot snapshot = GameSnapshot.of(game);

            //Assert
            assertThat(snapshot.playerTimer().state(), is(TimerState.PAUSED));
        }
    }

    @Nested
    @DisplayName("Player timer is correctly captured in snapshot")
    class PlayerTimerIsCorrectlyCapturedInSnapshot {

        Game game;

        @BeforeEach
        void init(){
            List<Player> players = List.of(
                    Player.create("Player 1", 0, false),
                    Player.create("Player 2", 0, false)
            );
            game = new GameImpl("Game 1", "game-1", players, gameEventEmitter);
        }

        @Test
        @DisplayName("Snapshot should capture NOT_STARTED player timer for new game")
        void snapshotShouldCaptureNotStartedPlayerTimerForNewGame(){

            //Act
            GameSnapshot snapshot = GameSnapshot.of(game);

            //Assert
            assertThat(snapshot.playerTimer().state(), is(TimerState.NOT_STARTED));
        }

        @Test
        @DisplayName("Snapshot should capture RUNNING player timer after start")
        void snapshotShouldCaptureRunningPlayerTimerAfterStart(){

            //Arrange
            game.startGame();

            //Act
            GameSnapshot snapshot = GameSnapshot.of(game);

            //Assert
            assertThat(snapshot.playerTimer().state(), is(TimerState.RUNNING));
        }
    }

    @Nested
    @DisplayName("Snapshot immutability")
    class SnapshotImmutability {

        Game game;

        @BeforeEach
        void init(){
            List<Player> players = List.of(
                    Player.create("Player 1", 0, false),
                    Player.create("Player 2", 0, false)
            );
            game = new GameImpl("Game 1", "game-1", players, gameEventEmitter);
        }

        @Test
        @DisplayName("Snapshot should not affect original game state")
        void snapshotShouldNotAffectOriginalGameState(){

            //Arrange
            GameSnapshot snapshot1 = GameSnapshot.of(game);
            game.startGame();

            //Act
            GameSnapshot snapshot2 = GameSnapshot.of(game);

            //Assert
            assertThat(snapshot1.gameState(), is(GameState.AWAITING_START));
            assertThat(snapshot2.gameState(), is(GameState.IN_PROGRESS));
        }

        @Test
        @DisplayName("Multiple snapshots should capture different states")
        void multipleSnapshotsShouldCaptureDifferentStates(){

            //Arrange
            GameSnapshot snapshot1 = GameSnapshot.of(game);
            game.startGame();
            GameSnapshot snapshot2 = GameSnapshot.of(game);
            game.pauseGame();
            GameSnapshot snapshot3 = GameSnapshot.of(game);

            //Assert
            assertThat(snapshot1.gameState(), is(GameState.AWAITING_START));
            assertThat(snapshot2.gameState(), is(GameState.IN_PROGRESS));
            assertThat(snapshot3.gameState(), is(GameState.IN_PROGRESS));
        }
    }
}
