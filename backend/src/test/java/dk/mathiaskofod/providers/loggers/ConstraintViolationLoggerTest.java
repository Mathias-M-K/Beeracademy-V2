package dk.mathiaskofod.providers.loggers;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import dk.mathiaskofod.helpers.CorrIdHelper;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import jakarta.validation.Path;
import java.util.Set;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ConstraintViolationLoggerTest {

    ConstraintViolationLogger logger;

    @BeforeEach
    void setUp() {
        logger = new ConstraintViolationLogger();
    }

    @AfterEach
    void tearDown() {
        CorrIdHelper.removeCorrId();
    }

    @SuppressWarnings("unchecked")
    private static ConstraintViolation<Object> violation(String propertyPath, String message) {
        ConstraintViolation<Object> violation = mock(ConstraintViolation.class);
        Path path = mock(Path.class, propertyPath);
        when(violation.getPropertyPath()).thenReturn(path);
        when(violation.getMessage()).thenReturn(message);
        return violation;
    }

    @DisplayName("Every violation of a ConstraintViolationException is read for logging")
    @Test
    void logsEveryConstraintViolation() {
        // Arrange
        ConstraintViolation<Object> partyIdViolation = violation("getGame.partyIdDto.partyId", "Invalid party ID format");
        ConstraintViolation<Object> participantIdViolation =
                violation("getGame.participantIdDto.id", "Invalid participant ID format");
        ConstraintViolationException exception =
                new ConstraintViolationException("validation failed", Set.of(partyIdViolation, participantIdViolation));

        CorrIdHelper.setCorrId("correlation-id");

        // Act
        logger.logConstraintViolations(exception);

        // Assert
        verify(partyIdViolation).getMessage();
        verify(participantIdViolation).getMessage();
    }

    @DisplayName("A missing correlation ID does not stop the violations from being logged")
    @Test
    void logsWithoutACorrelationId() {
        // Arrange
        ConstraintViolation<Object> partyIdViolation = violation("getGame.partyIdDto.partyId", "Invalid party ID format");
        ConstraintViolationException exception = new ConstraintViolationException("validation failed", Set.of(partyIdViolation));

        // Act
        logger.logConstraintViolations(exception);

        // Assert
        verify(partyIdViolation).getMessage();
    }

    @DisplayName("A throwable that is not a ConstraintViolationException is ignored")
    @Test
    void ignoresOtherThrowables() {
        // Arrange
        Throwable throwable = mock(Throwable.class);

        // Act
        logger.logConstraintViolations(throwable);

        // Assert
        verifyNoInteractions(throwable);
    }

    @DisplayName("A null throwable is ignored")
    @Test
    void ignoresNullThrowable() {
        // Arrange & Act & Assert
        assertDoesNotThrow(() -> logger.logConstraintViolations(null));
    }
}
