package dk.mathiaskofod.services.game;


import dk.mathiaskofod.common.dto.game.GameIdDto;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.util.Set;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.is;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.fail;

class GameIdDtoGeneratorTest {

    Validator validator;
    private static final int EXPECTED_GAME_ID_LENGTH = 9;

    @BeforeEach
    void setup() {
        try (ValidatorFactory factory = Validation.buildDefaultValidatorFactory()) {
            this.validator = factory.getValidator();
        } catch (Exception e) {
            fail("Couldn't initialize validator: " + e.getMessage());
        }
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

    @DisplayName("Valid gameId's should be accepted")
    @ParameterizedTest
    @ValueSource(strings = {"123abc123", "123-abc-123", "123123123", "abcabcabc", "abc-abc-abc", "123-123-123", "123----abc----123"})
    void validGameIdsShouldBeAccepted(String gameId) {
        Set<ConstraintViolation<GameIdDto>> violations = validator.validate(new GameIdDto(gameId));
        assertThat(violations.isEmpty(), is(true));
    }

    @DisplayName("Invalid gameId's should be rejected")
    @ParameterizedTest
    @ValueSource(strings = {"a", "1", "abcabcabcabc", "123123123123", "abd-abc-abc-abc", "123-123-123-123", "123-abc-123-abc", "a2c-1b3-c1a-2a3",")(/&{[]@","#¤%-#¤%-#¤%","abc@abc@abc"})
    void invalidGameIdsShouldBeRejected(String gameId) {
        Set<ConstraintViolation<GameIdDto>> violations = validator.validate(new GameIdDto(gameId));
        assertThat(violations.isEmpty(), is(false));
    }

    @DisplayName("GameId is normalized by removing dashes")
    @ParameterizedTest
    @ValueSource(strings = {"123----abc----123", "abc-abc-abc", "123-123-123","123abc123","abcabcabc","123123123"})
    void gameIdShouldBeNormalized(String gameId) {
        GameIdDto gameIdDto = assertDoesNotThrow(() -> new GameIdDto(gameId));
        assertThat(gameIdDto.gameId().length(), is(EXPECTED_GAME_ID_LENGTH));
    }
}