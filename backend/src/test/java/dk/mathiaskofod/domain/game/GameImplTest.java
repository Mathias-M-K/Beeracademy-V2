package dk.mathiaskofod.domain.game;

import dk.mathiaskofod.domain.game.deck.models.Suit;
import dk.mathiaskofod.domain.game.events.TestGameEventEmitter;
import dk.mathiaskofod.domain.game.events.emitter.GameEventEmitter;
import dk.mathiaskofod.domain.game.models.Chug;
import dk.mathiaskofod.domain.game.player.Player;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.util.List;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.is;

class GameImplTest {

    String gameId = "123abc123";
    GameImpl game;

    Player player1;
    Player player2;
    Player player3;

    GameEventEmitter emitter = new TestGameEventEmitter();

    @BeforeEach
    void init() {

        player1 = Player.create("Player1", 14, true);
        player2 = Player.create("Player2", 14, true);
        player3 = Player.create("Player3", 14, true);

        game = new GameImpl("Game under test", gameId, List.of(player1, player2, player3), emitter);
    }

    @Nested
    class PlayerOrder {

        @BeforeEach
        void init() {
            game.startGame();
        }

        @ParameterizedTest(name = "Turn {0} should be {1}")
        @CsvSource({
                "1, Player1",
                "2, Player2",
                "3, Player3",
                "4, Player1",
                "5, Player2",
                "6, Player3",
                "7, Player1"
        })
        @DisplayName("Turns are progressing as expected")
        void turnsAreProgressingAsExpected(int turn, String player) {

            //Act
            progressToTurn(turn);


            //Assert
            assertThat(game.getNextToDraw().name(), is(player));
        }
    }

    @Nested
    @DisplayName("Round number goes up")
    class RoundProgression{

        @BeforeEach
        void init() {
            game.startGame();
        }

        @ParameterizedTest
        @CsvSource({"1,1","4,2","7,3","10,4"})
        void whenAllPlayersAreFinishedRoundIsIncreased(int turn, int round) {

            //Act
            progressToTurn(turn);

            //Assert
            assertThat(game.getRound(), is(round));
        }

    }


    private void progressToTurn(int turn) {
        for (int turns = 0; turns < turn - 1; turns++) {
            game.drawCard(0);

            if (game.getLastCardDrawn().rank() == 14) {
                handleChuckCard();
            }
        }
    }

    private void handleChuckCard() {
        game.registerChug(new Chug(Suit.CIRCLE, 2000)); // Simulate a chug of 5 seconds
    }


}