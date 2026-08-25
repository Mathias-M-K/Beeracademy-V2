package dk.mathiaskofod.common.dto.party;

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

class PartyIdDtoTest {

    Validator validator;
    private static final int EXPECTED_PARTY_ID_LENGTH = 9;

    @BeforeEach
    void setup() {
        try (ValidatorFactory factory = Validation.buildDefaultValidatorFactory()) {
            this.validator = factory.getValidator();
        } catch (Exception e) {
            fail("Couldn't initialize validator: " + e.getMessage());
        }
    }

    @Test
    @DisplayName("PartyId's with same partyId are equal")
    void testPartyIdEquality() {
        // Arrange
        String partyIdString = "123abc123";

        PartyIdDto partyIdDto1 = new PartyIdDto(partyIdString);
        PartyIdDto partyIdDto2 = new PartyIdDto(partyIdString);

        // Act & Assert
        assertThat(partyIdDto1.equals(partyIdDto2), is(true));
    }

    @DisplayName("Valid partyId's should be accepted")
    @ParameterizedTest
    @ValueSource(
            strings = {
                "123abc123",
                "123-abc-123",
                "123123123",
                "abcabcabc",
                "abc-abc-abc",
                "123-123-123",
                "123----abc----123"
            })
    void validPartyIdsShouldBeAccepted(String partyId) {
        // Arrange
        PartyIdDto partyIdDto = new PartyIdDto(partyId);

        // Act
        Set<ConstraintViolation<PartyIdDto>> violations = validator.validate(partyIdDto);

        // Assert
        assertThat(violations.isEmpty(), is(true));
    }

    @DisplayName("Invalid partyId's should be rejected")
    @ParameterizedTest
    @ValueSource(
            strings = {
                "a",
                "1",
                "abcabcabcabc",
                "123123123123",
                "abd-abc-abc-abc",
                "123-123-123-123",
                "123-abc-123-abc",
                "a2c-1b3-c1a-2a3",
                ")(/&{[]@",
                "#¤%-#¤%-#¤%",
                "abc@abc@abc"
            })
    void invalidPartyIdsShouldBeRejected(String partyId) {
        // Arrange
        PartyIdDto partyIdDto = new PartyIdDto(partyId);

        // Act
        Set<ConstraintViolation<PartyIdDto>> violations = validator.validate(partyIdDto);

        // Assert
        assertThat(violations.isEmpty(), is(false));
    }

    @DisplayName("PartyId is normalized by removing dashes")
    @ParameterizedTest
    @ValueSource(strings = {"123----abc----123", "abc-abc-abc", "123-123-123", "123abc123", "abcabcabc", "123123123"})
    void partyIdShouldBeNormalized(String partyId) {
        // Arrange & Act
        PartyIdDto partyIdDto = assertDoesNotThrow(() -> new PartyIdDto(partyId));

        // Assert
        assertThat(partyIdDto.partyId().length(), is(EXPECTED_PARTY_ID_LENGTH));
    }
}
