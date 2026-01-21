package dk.mathiaskofod.domain.game;

import dk.mathiaskofod.domain.game.deck.models.Suit;
import dk.mathiaskofod.domain.game.events.TestGameEventEmitter;
import dk.mathiaskofod.domain.game.events.emitter.GameEventEmitter;
import dk.mathiaskofod.domain.game.models.Chug;
import dk.mathiaskofod.domain.game.player.Player;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.is;

class GameTest {

    String gameId = "123abc123";
    GameImpl game;

    Player player1;
    Player player2;
    Player player3;

    GameEventEmitter emitter = new TestGameEventEmitter();

    @BeforeEach
    void init(){

        player1 = Player.create("Player1");
        player2 = Player.create("Player2");
        player3 = Player.create("Player3");

        game = new GameImpl("Game under test", gameId, List.of(player1,player2,player3), emitter);
    }

    @Nested
    class PlayerOrder {

        @BeforeEach
        void init(){
            game.startGame();
        }

        @Test
        @DisplayName("First player is player1")
        void firstPlayerIsPlayerOne(){

            //Arrange
            Player expectedFirstPlayer = player1;

            //Assert
            assertThat(game.getCurrentPlayer(), is(expectedFirstPlayer));

        }

        @Test
        @DisplayName("Second player is player 2")
        void secondPlayerIsPlayerTwo(){

            //Arrange
            Player expectedSecondPlayer = player2;

            //Act
            for(int turns = 0; turns < 1; turns++){
                game.drawCard(0);

                if (game.getLastCard().rank() == 14) {
                    // If the last drawn card is a chug card, we need to simulate a chug to continue
                    game.registerChug(new Chug(Suit.CIRCLE,2000)); // Simulate a chug of 5 seconds
                }
            }


            //Assert
            assertThat(game.getCurrentPlayer(), is(expectedSecondPlayer));
        }

        @Test
        @DisplayName("Third player is player 3")
        void thirdPlayerIsPlayerThree(){

            //Arrange
            Player expectedThirdPlayer = player3;

            //Act
            for(int turns = 0; turns < 2; turns++){
                game.drawCard(0);

                if (game.getLastCard().rank() == 14) {
                    // If the last drawn card is a chug card, we need to simulate a chug to continue
                    game.registerChug(new Chug(Suit.CIRCLE,2000)); // Simulate a chug of 5 seconds
                }
            }

            //Assert
            assertThat(game.getCurrentPlayer(), is(expectedThirdPlayer));
        }

        @Test
        @DisplayName("Forth player is player 1")
        void forthPlayerIsPlayerOne(){

            //Arrange
            Player expectedForthPlayer = player1;

            //Act
            for(int turns = 0; turns < 3; turns++){
                game.drawCard(0);

                if (game.getLastCard().rank() == 14) {
                    // If the last drawn card is a chug card, we need to simulate a chug to continue
                    game.registerChug(new Chug(Suit.CIRCLE,2000)); // Simulate a chug of 5 seconds
                }
            }

            //Arrange
            assertThat(game.getCurrentPlayer(),is(expectedForthPlayer));
        }

        @Test
        @DisplayName("Fifth player is player 2")
        void fifthPlayerIsPlayerOne(){

            //Arrange
            Player expectedForthPlayer = player2;

            //Act
            for(int turns = 0; turns < 4; turns++){
                game.drawCard(0);

                if (game.getLastCard().rank() == 14) {
                    // If the last drawn card is a chug card, we need to simulate a chug to continue
                    game.registerChug(new Chug(Suit.CIRCLE,2000)); // Simulate a chug of 5 seconds
                }
            }

            //Arrange
            assertThat(game.getCurrentPlayer(),is(expectedForthPlayer));
        }

        @Test
        @DisplayName("Sixth player is player 3")
        void sixthPlayerIsPlayerOne(){

            //Arrange
            Player expectedForthPlayer = player3;

            //Act
            for(int turns = 0; turns < 5; turns++){
                game.drawCard(0);

                if (game.getLastCard().rank() == 14) {
                    // If the last drawn card is a chug card, we need to simulate a chug to continue
                    game.registerChug(new Chug(Suit.CIRCLE,2000)); // Simulate a chug of 5 seconds
                }
            }

            //Arrange
            assertThat(game.getCurrentPlayer(),is(expectedForthPlayer));
        }

        @Test
        @DisplayName("Seventh player is player 1")
        void seventhPlayerIsPlayerOne(){

            //Arrange
            Player expectedForthPlayer = player1;

            //Act
            for(int turns = 0; turns < 6; turns++){
                game.drawCard(0);

                if (game.getLastCard().rank() == 14) {
                    // If the last drawn card is a chug card, we need to simulate a chug to continue
                    game.registerChug(new Chug(Suit.CIRCLE,2000)); // Simulate a chug of 5 seconds
                }
            }

            //Arrange
            assertThat(game.getCurrentPlayer(),is(expectedForthPlayer));
        }
    }



}