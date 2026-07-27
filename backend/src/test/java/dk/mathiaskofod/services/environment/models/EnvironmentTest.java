package dk.mathiaskofod.services.environment.models;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import dk.mathiaskofod.services.environment.exceptions.EnvironmentNotRecognizedException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class EnvironmentTest {

    @DisplayName("fromString resolves known environments regardless of case")
    @Test
    void fromStringResolvesKnownValues() {
        // Act & Assert
        assertEquals(Environment.TEST, Environment.fromString("test"));
        assertEquals(Environment.DEV, Environment.fromString("DEV"));
        assertEquals(Environment.PROD, Environment.fromString("Prod"));
    }

    @DisplayName("fromString throws for an unrecognized environment")
    @Test
    void fromStringThrowsForUnknownValue() {
        // Act & Assert
        assertThrows(EnvironmentNotRecognizedException.class, () -> Environment.fromString("staging"));
    }
}
