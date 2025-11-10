package dk.mathiaskofod.services.game;

import dk.mathiaskofod.services.game.game.id.generator.models.GameId;
import dk.mathiaskofod.services.player.models.Player;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.time.Duration;
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
            game.progressGame();

            //Assert
            assertThat(game.currentPlayer, is(expectedSecondPlayer));
        }

        @Test
        @DisplayName("Third player is player 3")
        void thirdPlayerIsPlayerThree(){

            //Arrange
            Player expectedThirdPlayer = player3;

            //Act
            game.progressGame();
            game.progressGame();

            //Assert
            assertThat(game.currentPlayer, is(expectedThirdPlayer));
        }

        @Test
        @DisplayName("Forth player is player 1")
        void forthPlayerIsPlayerOne(){

            //Arrange
            Player expectedForthPlayer = player1;

            //Act
            game.progressGame();
            game.progressGame();
            game.progressGame();

            //Arrange
            assertThat(game.currentPlayer,is(player1));
        }
    }

    @Nested
    class Time{

        @Test
        @DisplayName("Something about time")
        void timeTest(){

            Duration server = Duration.ofMinutes(2);
            Duration client = Duration.ofSeconds(115);

            Duration diff = Duration.ofMillis(client.toMillis()-server.toMillis());

            System.out.println("Diff:" + diff.getSeconds());
        }

    }


}