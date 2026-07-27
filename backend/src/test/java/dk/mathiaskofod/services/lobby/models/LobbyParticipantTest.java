package dk.mathiaskofod.services.lobby.models;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class LobbyParticipantTest {

    @DisplayName("The convenience constructor applies the default sips and ace settings")
    @Test
    void defaultsAreApplied() {
        // Act
        LobbyParticipant participant = new LobbyParticipant("Bob", "Apprentice", "p1", true, 2);

        // Assert
        assertEquals("Bob", participant.getName());
        assertEquals("Apprentice", participant.getTitle());
        assertEquals("p1", participant.getId());
        assertEquals(14, participant.getSipsInABeer());
        assertTrue(participant.canDrawAce());
        assertTrue(participant.isActive());
        assertEquals(2, participant.getPosition());
    }

    @DisplayName("updateSettings overwrites sips and ace permission")
    @Test
    void updateSettings() {
        // Arrange
        LobbyParticipant participant = new LobbyParticipant("Bob", "Apprentice", "p1", true, 0);

        // Act
        participant.updateSettings(7, false);

        // Assert
        assertEquals(7, participant.getSipsInABeer());
        assertFalse(participant.canDrawAce());
    }

    @DisplayName("Setters update mutable participant fields")
    @Test
    void settersWork() {
        // Arrange
        LobbyParticipant participant = new LobbyParticipant("Bob", "Apprentice", "p1", true, 0);

        // Act
        participant.setName("Alice");
        participant.setPosition(5);
        participant.setActive(false);

        // Assert
        assertEquals("Alice", participant.getName());
        assertEquals(5, participant.getPosition());
        assertFalse(participant.isActive());
    }
}
