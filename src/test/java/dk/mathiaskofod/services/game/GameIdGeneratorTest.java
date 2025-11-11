package dk.mathiaskofod.services.game;


import dk.mathiaskofod.services.game.id.generator.models.GameId;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.is;

class GameIdGeneratorTest {

    @Test
    @DisplayName("123abc123 is 123-abc-123 an human readable id")
    void testHumanReadableId() {

        //Arrange
        String gameId = "123abc123";
        String expectedHumanReadableId = "123-abc-123";

        //Act
        String humanReadableId = new GameId(gameId).humanReadableId();

        //Arrange
        assertThat(humanReadableId, is(expectedHumanReadableId));
    }

    @Test
    @DisplayName("GameId's with same id are equal")
    void testGameIdEquality() {
        //Arrange
        String gameIdString = "123abc123";

        GameId gameId1 = new GameId(gameIdString);
        GameId gameId2 = new GameId(gameIdString);

        //Act & Assert
        assertThat(gameId1.equals(gameId2), is(true));
    }

}