package dk.mathiaskofod.domain.game;

import dk.mathiaskofod.domain.game.deck.DeckSnapshot;
import dk.mathiaskofod.domain.game.deck.models.Suit;
import dk.mathiaskofod.domain.game.events.TestGameEventEmitter;
import dk.mathiaskofod.domain.game.events.emitter.GameEventEmitter;
import dk.mathiaskofod.domain.game.models.Chug;
import dk.mathiaskofod.domain.game.player.Player;
import dk.mathiaskofod.domain.game.timer.TimerSnapshot;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.util.ArrayList;
import java.util.LinkedList;
import java.util.List;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.is;
import static org.mockito.Mockito.*;

class GameImplTest {

    String gameId = "123abc123";

    Player defaultPlayer1;
    Player defaultPlayer2;
    Player defaultPlayer3;

    GameEventEmitter emitter = new TestGameEventEmitter();

    @BeforeEach
    void init() {
        defaultPlayer1 = Player.create("Player1", 14, true);
        defaultPlayer2 = Player.create("Player2", 14, true);
        defaultPlayer3 = Player.create("Player3", 14, true);
    }

    @Nested
    class PlayerOrder {

        GameImpl game;

        @BeforeEach
        void init() {
            game = new GameImpl(
                    "Game under test", gameId, List.of(defaultPlayer1, defaultPlayer2, defaultPlayer3), emitter);
            game.startGame();
        }

        @ParameterizedTest(name = "Turn {0} should be {1}")
        @CsvSource({"1, Player1", "2, Player2", "3, Player3", "4, Player1", "5, Player2", "6, Player3", "7, Player1"})
        @DisplayName("Turns are progressing as expected")
        void turnsAreProgressingAsExpected(int turn, String player) {

            // Act
            progressToTurn(game, turn);

            // Assert
            assertThat(game.getNextToDraw().name(), is(player));
        }
    }

    @Nested
    @DisplayName("Round number goes up")
    class RoundProgression {

        GameImpl game;

        @BeforeEach
        void init() {
            game = new GameImpl(
                    "Game under test", gameId, List.of(defaultPlayer1, defaultPlayer2, defaultPlayer3), emitter);
            game.startGame();
        }

        @ParameterizedTest
        @CsvSource({"1,1", "4,2", "7,3", "10,4"})
        void whenAllPlayersAreFinishedRoundIsIncreased(int turn, int round) {

            // Act
            progressToTurn(game, turn);

            // Assert
            assertThat(game.round, is(round));
        }
    }

    @Nested
    @DisplayName("Persistence from GameData obj")
    class PersistenceFromGameData {

        LinkedList<Player> players = new LinkedList<>();

        GameSnapshot gameSnapshotMock;
        TimerSnapshot timerSnapshotMock;
        DeckSnapshot deckSnapshotMock;

        @BeforeEach
        void init() {

            players.add(defaultPlayer1);
            players.add(defaultPlayer2);
            players.add(defaultPlayer3);

            gameSnapshotMock = mock(GameSnapshot.class);
            timerSnapshotMock = mock(TimerSnapshot.class);
            deckSnapshotMock = mock(DeckSnapshot.class);

            when(gameSnapshotMock.playerTimer()).thenReturn(timerSnapshotMock);
            when(gameSnapshotMock.gameTimer()).thenReturn(timerSnapshotMock);
            when(gameSnapshotMock.deck()).thenReturn(deckSnapshotMock);
            when(gameSnapshotMock.playerQueue()).thenReturn(players);
        }

        @ParameterizedTest(name = "{0} Players with {1} turns should result in game being in round {2}")
        @CsvSource({"2,1,1", "2,2,2", "2,5,3", "4,4,2", "4,3,1", "4,9,3"})
        void withFourPlayersAndOneTurn(int nrOfPlayers, int nrOfTurns, int expectedRoundNr) {

            // Arrange
            List<String> playersSpy = spy(new ArrayList<>());
            doReturn(nrOfPlayers).when(playersSpy).size();

            when(gameSnapshotMock.playerOrder()).thenReturn(playersSpy);
            when(gameSnapshotMock.turnCounter()).thenReturn(nrOfTurns);

            // Act
            GameImpl game = new GameImpl(gameSnapshotMock, emitter);

            // Assert
            assertThat(game.round, is(expectedRoundNr));
        }
    }

    private void progressToTurn(Game game, int turn) {
        for (int turns = 0; turns < turn - 1; turns++) {
            game.drawCard(0);

            if (game.getLastCardDrawn().rank() == 14) {
                handleChuckCard(game);
            }
        }
    }

    private void handleChuckCard(Game game) {
        game.registerChug(new Chug(Suit.CIRCLE, 2000)); // Simulate a chug of 5 seconds
    }
}
