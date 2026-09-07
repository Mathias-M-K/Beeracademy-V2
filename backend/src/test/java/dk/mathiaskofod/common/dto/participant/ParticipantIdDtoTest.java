package dk.mathiaskofod.common.dto.participant;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.is;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.fail;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import java.util.Set;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

class ParticipantIdDtoTest {

    Validator validator;
    private static final int EXPECTED_PARTICIPANT_ID_LENGTH = 12;

    @BeforeEach
    void setup() {
        try (ValidatorFactory factory = Validation.buildDefaultValidatorFactory()) {
            this.validator = factory.getValidator();
        } catch (Exception e) {
            fail("Couldn't initialize validator: " + e.getMessage());
        }
    }

    @Test
    @DisplayName("ParticipantId's with same id are equal")
    void testParticipantIdEquality() {
        // Arrange
        String participantIdString = "123abc123abc";

        ParticipantIdDto participantIdDto1 = new ParticipantIdDto(participantIdString);
        ParticipantIdDto participantIdDto2 = new ParticipantIdDto(participantIdString);

        // Act & Assert
        assertThat(participantIdDto1.equals(participantIdDto2), is(true));
    }

    @DisplayName("Valid participantId's should be accepted")
    @ParameterizedTest
    @ValueSource(
            strings = {
                "123abc123abc",
                "123-abc-123-abc",
                "123123123123",
                "abcabcabcabc",
                "abc-abc-abc-abc",
                "123----abc123abc"
            })
    void validParticipantIdsShouldBeAccepted(String participantId) {
        // Arrange
        ParticipantIdDto participantIdDto = new ParticipantIdDto(participantId);

        // Act
        Set<ConstraintViolation<ParticipantIdDto>> violations = validator.validate(participantIdDto);

        // Assert
        assertThat(violations.isEmpty(), is(true));
    }

    @DisplayName("Invalid participantId's should be rejected")
    @ParameterizedTest
    @ValueSource(
            strings = {
                "a",
                "1",
                "abcabcabc",
                "123123123",
                "abcabcabcabcabc",
                "123-abc-123",
                ")(/&{[]@",
                "#¤%-#¤%-#¤%-#¤%",
                "abc@abc@abc@"
            })
    void invalidParticipantIdsShouldBeRejected(String participantId) {
        // Arrange
        ParticipantIdDto participantIdDto = new ParticipantIdDto(participantId);

        // Act
        Set<ConstraintViolation<ParticipantIdDto>> violations = validator.validate(participantIdDto);

        // Assert
        assertThat(violations.isEmpty(), is(false));
    }

    @DisplayName("ParticipantId is normalized by removing dashes")
    @ParameterizedTest
    @ValueSource(strings = {"123----abc123abc", "abc-abc-abc-abc", "123-123-123-123", "123abc123abc"})
    void participantIdShouldBeNormalized(String participantId) {
        // Arrange & Act
        ParticipantIdDto participantIdDto = assertDoesNotThrow(() -> new ParticipantIdDto(participantId));

        // Assert
        assertThat(participantIdDto.id().length(), is(EXPECTED_PARTICIPANT_ID_LENGTH));
    }
}
