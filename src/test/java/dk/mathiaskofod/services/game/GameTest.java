package dk.mathiaskofod.services.game;

import dk.mathiaskofod.services.game.game.id.generator.models.GameId;
import dk.mathiaskofod.services.game.models.Stats;
import dk.mathiaskofod.services.game.models.Turn;
import dk.mathiaskofod.services.player.models.Player;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.is;

class GameTest {

    String gameId = "123abc123";
    Game game;

    Player player1;
    Player player2;
    Player player3;

    @BeforeEach
    void init(){

        player1 = Player.create("Player1");
        player2 = Player.create("Player2");
        player3 = Player.create("Player3");

        GameId gameId = new GameId(this.gameId);
        game = new Game("Game under test",gameId, List.of(player1,player2,player3));
    }

    @Nested
    class PlayerOrder{

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
            assertThat(game.currentPlayer, is(expectedFirstPlayer));

        }

        @Test
        @DisplayName("Second player is player 2")
        void secondPlayerIsPlayerTwo(){

            //Arrange
            Player expectedSecondPlayer = player2;

            //Act
            for(int turns = 0; turns < 1; turns++){
                game.endTurn(0);
            }


            //Assert
            assertThat(game.currentPlayer, is(expectedSecondPlayer));
        }

        @Test
        @DisplayName("Third player is player 3")
        void thirdPlayerIsPlayerThree(){

            //Arrange
            Player expectedThirdPlayer = player3;

            //Act
            for(int turns = 0; turns < 2; turns++){
                game.endTurn(0);
            }

            //Assert
            assertThat(game.currentPlayer, is(expectedThirdPlayer));
        }

        @Test
        @DisplayName("Forth player is player 1")
        void forthPlayerIsPlayerOne(){

            //Arrange
            Player expectedForthPlayer = player1;

            //Act
            for(int turns = 0; turns < 3; turns++){
                game.endTurn(0);
            }

            //Arrange
            assertThat(game.currentPlayer,is(expectedForthPlayer));
        }

        @Test
        @DisplayName("Fifth player is player 2")
        void fifthPlayerIsPlayerOne(){

            //Arrange
            Player expectedForthPlayer = player2;

            //Act
            for(int turns = 0; turns < 4; turns++){
                game.endTurn(0);
            }

            //Arrange
            assertThat(game.currentPlayer,is(expectedForthPlayer));
        }

        @Test
        @DisplayName("Sixth player is player 3")
        void sixthPlayerIsPlayerOne(){

            //Arrange
            Player expectedForthPlayer = player3;

            //Act
            for(int turns = 0; turns < 5; turns++){
                game.endTurn(0);
            }

            //Arrange
            assertThat(game.currentPlayer,is(expectedForthPlayer));
        }

        @Test
        @DisplayName("Seventh player is player 1")
        void seventhPlayerIsPlayerOne(){

            //Arrange
            Player expectedForthPlayer = player1;

            //Act
            for(int turns = 0; turns < 6; turns++){
                game.endTurn(0);
            }

            //Arrange
            assertThat(game.currentPlayer,is(expectedForthPlayer));
        }
    }

    @Test
    @DisplayName("Exception is thrown ")
    void test(){
        game.startGame();;

        for(int i = 0; i<3*13; i++){
            game.endTurn(0);
        }

        for(Player p : game.getPlayers()){
            System.out.println("");
            System.out.println(p.name());
            for(Turn t : p.stats().getTurns()){
                System.out.println(t);
            }
        }
    }


}