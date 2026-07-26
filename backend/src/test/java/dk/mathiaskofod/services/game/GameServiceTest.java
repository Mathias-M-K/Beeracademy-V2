package dk.mathiaskofod.services.game;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import dk.mathiaskofod.domain.game.Game;
import dk.mathiaskofod.domain.game.GameImpl;
import dk.mathiaskofod.domain.game.GameSnapshot;
import dk.mathiaskofod.domain.game.deck.models.Suit;
import dk.mathiaskofod.domain.game.events.emitter.GameEventEmitterImpl;
import dk.mathiaskofod.domain.game.models.Chug;
import dk.mathiaskofod.domain.game.models.GameState;
import dk.mathiaskofod.domain.game.player.Player;
import dk.mathiaskofod.domain.game.player.models.Stats;
import dk.mathiaskofod.domain.game.reports.GameReport;
import dk.mathiaskofod.domain.game.reports.PlayerReport;
import dk.mathiaskofod.domain.game.timer.TimerReports;
import dk.mathiaskofod.services.game.exceptions.GameNotFoundException;
import dk.mathiaskofod.services.game.exceptions.PlayerNotFoundException;
import io.quarkus.redis.datasource.RedisDataSource;
import io.quarkus.redis.datasource.value.ValueCommands;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class GameServiceTest {

    @Mock
    GameEventEmitterImpl gameEventEmitterImpl;

    @Mock
    RedisDataSource redisDataSource;

    @Mock
    ValueCommands<String, GameSnapshot> gameSnapshots;

    GameService gameService;

    private static final String GAME_ID = "test-game-123";

    @BeforeEach
    void setUp() {
        // Stub the RedisDataSource call before manual construction to avoid the race condition
        when(redisDataSource.value(GameSnapshot.class)).thenReturn(gameSnapshots);

        gameService = new GameService(redisDataSource);
        gameService.gameEventEmitterImpl = gameEventEmitterImpl;
    }

    private GameImpl createTestGame(String gameId, GameState state) {
        Player p1 = new Player("Player 1", "p1", 10, true, new Stats());
        Player p2 = new Player("Player 2", "p2", 10, true, new Stats());
        GameImpl game = new GameImpl("Test Game", gameId, List.of(p1, p2), gameEventEmitterImpl);

        if (state == GameState.IN_PROGRESS || state == GameState.FINISHED) {
            game.startGame();
        }
        if (state == GameState.FINISHED) {
            game.endGame();
        }
        return game;
    }

    @Nested
    @DisplayName("Game Existence Tests")
    class GameExistence {

        @DisplayName("Game does not exist")
        @Test
        void gameDoesNotExist() {
            // Arrange
            when(gameSnapshots.get(GAME_ID)).thenReturn(null);

            // Act
            boolean exists = gameService.gameExists(GAME_ID);

            // Assert
            assertFalse(exists);
        }

        @DisplayName("gameExists should return false when NullPointerException is thrown")
        @Test
        void gameExistsThrowsNullPointerException() {
            // Arrange
            when(gameSnapshots.get(GAME_ID)).thenThrow(new NullPointerException("Simulated NPE"));

            // Act
            boolean exists = gameService.gameExists(GAME_ID);

            // Assert
            assertFalse(exists);
        }

        @DisplayName("Game not found exception on getGame")
        @Test
        void gameNotFound() {
            // Arrange
            when(gameSnapshots.get(GAME_ID)).thenReturn(null);

            // Act & Assert
            assertThrows(GameNotFoundException.class, () -> gameService.getGame(GAME_ID));
        }
    }

    @Nested
    @DisplayName("Create Game Tests")
    class CreateGame {

//        @DisplayName("createGame should instantiate and save game correctly")
//        @Test
//        void createGameSuccessfully() {
//            // Arrange
//            String name = "New Beer Game";
//            Player p1 = new Player("Alice", "p1", 10, true, new Stats());
//            Player p2 = new Player("Bob", "p2", 10, true, new Stats());
//            List<Player> players = List.of(p1, p2);
//
//            // Act
//            gameService.createGame(name,"", players);
//
//            // Assert
//            assertThat(generatedId, is(notNullValue()));
//            verify(gameSnapshots).set(eq(generatedId), any(GameSnapshot.class));
//        }
    }

    @Nested
    @DisplayName("Game Controls Tests")
    class GameControls {

        @DisplayName("startGame should update state and emit event")
        @Test
        void startGameSuccessfully() {
            // Arrange
            GameImpl game = createTestGame(GAME_ID, GameState.AWAITING_START);
            when(gameSnapshots.get(GAME_ID)).thenReturn(GameSnapshot.of(game));

            // Act
            gameService.startGame(GAME_ID);

            // Assert
            verify(gameEventEmitterImpl).onStartGame(any(Game.class));
            verify(gameSnapshots).set(eq(GAME_ID), any(GameSnapshot.class));
        }

        @DisplayName("endGame should finalize game and emit event")
        @Test
        void endGameSuccessfully() {
            // Arrange
            GameImpl game = createTestGame(GAME_ID, GameState.IN_PROGRESS);
            when(gameSnapshots.get(GAME_ID)).thenReturn(GameSnapshot.of(game));

            // Act
            gameService.endGame(GAME_ID);

            // Assert
            verify(gameEventEmitterImpl).onEndGame(any(Game.class));
            verify(gameSnapshots).set(eq(GAME_ID), any(GameSnapshot.class));
        }

        @DisplayName("pauseGame should pause timers and emit event")
        @Test
        void pauseGameSuccessfully() {
            // Arrange
            GameImpl game = createTestGame(GAME_ID, GameState.IN_PROGRESS);
            when(gameSnapshots.get(GAME_ID)).thenReturn(GameSnapshot.of(game));

            // Act
            gameService.pauseGame(GAME_ID);

            // Assert
            verify(gameEventEmitterImpl).onPauseGame(any(Game.class));
            verify(gameSnapshots).set(eq(GAME_ID), any(GameSnapshot.class));
        }

        @DisplayName("resumeGame should resume timers and emit event")
        @Test
        void resumeGameSuccessfully() {
            // Arrange
            GameImpl game = createTestGame(GAME_ID, GameState.IN_PROGRESS);
            game.pauseGame();
            when(gameSnapshots.get(GAME_ID)).thenReturn(GameSnapshot.of(game));

            // Act
            gameService.resumeGame(GAME_ID);

            // Assert
            verify(gameEventEmitterImpl).onResumeGame(any(Game.class));
            verify(gameSnapshots).set(eq(GAME_ID), any(GameSnapshot.class));
        }
    }

    @Nested
    @DisplayName("Game Action Tests")
    class GameActions {

        @DisplayName("drawCard should draw card and progress turn queue")
        @Test
        void drawCardSuccessfully() {
            // Arrange
            GameImpl game = createTestGame(GAME_ID, GameState.IN_PROGRESS);
            when(gameSnapshots.get(GAME_ID)).thenReturn(GameSnapshot.of(game));

            // Act
            gameService.drawCard(1500L, GAME_ID);

            // Assert
            verify(gameEventEmitterImpl).onDrawCard(any(), any(), any(), any(), any(Game.class));
            verify(gameSnapshots).set(eq(GAME_ID), any(GameSnapshot.class));
        }

        @DisplayName("registerChug should record chug and transition state to IN_PROGRESS")
        @Test
        void registerChugSuccessfully() {
            // Arrange
            GameImpl game = createTestGame(GAME_ID, GameState.IN_PROGRESS);
            GameSnapshot original = GameSnapshot.of(game);

            // Construct a snapshot in AWAITING_CHUG state so we can register a chug
            GameSnapshot awaitingChugSnapshot = new GameSnapshot(
                    original.gameId(),
                    original.name(),
                    GameState.AWAITING_CHUG,
                    original.turnCounter(),
                    original.lastCard(),
                    original.playerOrder(),
                    original.playerQueue(),
                    original.deck(),
                    original.gameTimer(),
                    original.playerTimer());
            when(gameSnapshots.get(GAME_ID)).thenReturn(awaitingChugSnapshot);
            Chug chug = new Chug(Suit.HEART, 4500L);

            // Act
            gameService.registerChug(chug, GAME_ID);

            // Assert
            verify(gameEventEmitterImpl).onNewChug(eq(chug), any(), any(), any(Game.class));
            verify(gameSnapshots).set(eq(GAME_ID), any(GameSnapshot.class));
        }
    }

    @Nested
    @DisplayName("Player Query Tests")
    class PlayerQueries {

        @DisplayName("getPlayer should return correct player by id")
        @Test
        void getPlayerSuccessfully() {
            // Arrange
            GameImpl game = createTestGame(GAME_ID, GameState.IN_PROGRESS);
            when(gameSnapshots.get(GAME_ID)).thenReturn(GameSnapshot.of(game));

            // Act
            Player found = gameService.getPlayer(GAME_ID, "p1");

            // Assert
            assertThat(found, is(notNullValue()));
            assertThat(found.id(), is("p1"));
        }

        @DisplayName("getPlayer should throw PlayerNotFoundException when player ID does not exist")
        @Test
        void getPlayerNotFound() {
            // Arrange
            GameImpl game = createTestGame(GAME_ID, GameState.IN_PROGRESS);
            when(gameSnapshots.get(GAME_ID)).thenReturn(GameSnapshot.of(game));

            // Act & Assert
            assertThrows(PlayerNotFoundException.class, () -> gameService.getPlayer(GAME_ID, "non-existent"));
        }

        @DisplayName("getCurrentPlayer should return next player to draw")
        @Test
        void getCurrentPlayerSuccessfully() {
            // Arrange
            GameImpl game = createTestGame(GAME_ID, GameState.IN_PROGRESS);
            Player expectedNext = game.getNextToDraw();
            when(gameSnapshots.get(GAME_ID)).thenReturn(GameSnapshot.of(game));

            // Act
            Player current = gameService.getCurrentPlayer(GAME_ID);

            // Assert
            assertThat(current, is(notNullValue()));
            assertThat(current.id(), is(expectedNext.id()));
        }
    }

    @Nested
    @DisplayName("Report Generator Tests")
    class Reports {

        @DisplayName("getGameReport should build a valid game report")
        @Test
        void getGameReportSuccessfully() {
            // Arrange
            GameImpl game = createTestGame(GAME_ID, GameState.IN_PROGRESS);
            when(gameSnapshots.get(GAME_ID)).thenReturn(GameSnapshot.of(game));

            // Act
            GameReport report = gameService.getGameReport(GAME_ID);

            // Assert
            assertThat(report, is(notNullValue()));
        }

        @DisplayName("getPlayerReports should return list of player reports")
        @Test
        void getPlayerReportsSuccessfully() {
            // Arrange
            GameImpl game = createTestGame(GAME_ID, GameState.IN_PROGRESS);
            when(gameSnapshots.get(GAME_ID)).thenReturn(GameSnapshot.of(game));

            // Act
            List<PlayerReport> reports = gameService.getPlayerReports(GAME_ID);

            // Assert
            assertThat(reports, is(notNullValue()));
            assertThat(reports.size(), is(2));
        }

        @DisplayName("getTimeReport should return game and player timer reports")
        @Test
        void getTimeReportSuccessfully() {
            // Arrange
            GameImpl game = createTestGame(GAME_ID, GameState.IN_PROGRESS);
            when(gameSnapshots.get(GAME_ID)).thenReturn(GameSnapshot.of(game));

            // Act
            TimerReports reports = gameService.getTimeReport(GAME_ID);

            // Assert
            assertThat(reports, is(notNullValue()));
            assertThat(reports.gameTimeReport(), is(notNullValue()));
            assertThat(reports.playerTimeReport(), is(notNullValue()));
        }
    }
}
