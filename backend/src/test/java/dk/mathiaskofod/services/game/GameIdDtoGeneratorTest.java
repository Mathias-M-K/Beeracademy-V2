package dk.mathiaskofod.services.game;


import dk.mathiaskofod.api.game.models.GameIdDto;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.is;

class GameIdDtoGeneratorTest {

    @Test
    @DisplayName("123abc123 is 123-abc-123 an human readable gameId")
    void testHumanReadableId() {

        //Arrange
        String gameId = "123abc123";
        String expectedHumanReadableId = "123-abc-123";

        //Act
        String humanReadableId = new GameIdDto(gameId).humanReadableId();

        //Arrange
        assertThat(humanReadableId, is(expectedHumanReadableId));
    }

    @Test
    @DisplayName("GameId's with same gameId are equal")
    void testGameIdEquality() {
        //Arrange
        String gameIdString = "123abc123";

        GameIdDto gameIdDto1 = new GameIdDto(gameIdString);
        GameIdDto gameIdDto2 = new GameIdDto(gameIdString);

        //Act & Assert
        assertThat(gameIdDto1.equals(gameIdDto2), is(true));
    }

}