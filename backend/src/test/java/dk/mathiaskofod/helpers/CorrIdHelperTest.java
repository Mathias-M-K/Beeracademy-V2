package dk.mathiaskofod.helpers;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.Optional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class CorrIdHelperTest {

    private static final String CORR_ID = "5d1f0b3a-1c2d-4e5f-8a9b-0c1d2e3f4a5b";

    @AfterEach
    void tearDown() {
        CorrIdHelper.removeCorrId();
    }

    @DisplayName("A correlation ID that was set can be read back")
    @Test
    void setCorrIdIsReadable() {
        // Arrange
        CorrIdHelper.setCorrId(CORR_ID);

        // Act
        Optional<String> corrId = CorrIdHelper.getCorrId();

        // Assert
        assertEquals(Optional.of(CORR_ID), corrId);
    }

    @DisplayName("Reading a correlation ID that was never set yields an empty Optional")
    @Test
    void unsetCorrIdIsEmpty() {
        // Arrange & Act
        Optional<String> corrId = CorrIdHelper.getCorrId();

        // Assert
        assertTrue(corrId.isEmpty(), "No correlation ID has been set on this thread");
    }

    @DisplayName("Setting a correlation ID twice keeps the most recent one")
    @Test
    void setCorrIdOverwritesPreviousValue() {
        // Arrange
        CorrIdHelper.setCorrId("first-correlation-id");

        // Act
        CorrIdHelper.setCorrId(CORR_ID);

        // Assert
        assertEquals(Optional.of(CORR_ID), CorrIdHelper.getCorrId());
    }

    @DisplayName("Removing the correlation ID clears it")
    @Test
    void removeCorrIdClearsValue() {
        // Arrange
        CorrIdHelper.setCorrId(CORR_ID);

        // Act
        CorrIdHelper.removeCorrId();

        // Assert
        assertTrue(CorrIdHelper.getCorrId().isEmpty(), "The correlation ID should not outlive its removal");
    }

    @DisplayName("The correlation ID header name is the one clients send")
    @Test
    void correlationIdHeaderName() {
        // Arrange & Act & Assert
        assertEquals("X-Correlation-ID", CorrIdHelper.CORRELATION_ID_HEADER);
    }
}
