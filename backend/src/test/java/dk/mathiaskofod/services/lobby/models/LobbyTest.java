package dk.mathiaskofod.services.lobby.models;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class LobbyTest {

    private Lobby lobby;

    @BeforeEach
    void setUp() {
        lobby = new Lobby("My Lobby", "lobby-1");
    }

    @DisplayName("A new lobby exposes its name and id and starts neither abandoned nor transitioning")
    @Test
    void newLobbyDefaults() {
        // Assert
        assertEquals("My Lobby", lobby.getName());
        assertEquals("lobby-1", lobby.getId());
        assertFalse(lobby.isAbandoned());
        assertFalse(lobby.isTransitioning());
        assertTrue(lobby.getParticipants().isEmpty());
    }

    @DisplayName("Participants can be added and fetched by id")
    @Test
    void addAndGetParticipant() {
        // Arrange
        LobbyParticipant participant = new LobbyParticipant("Bob", "title", "p1", true, 0);

        // Act
        lobby.addParticipant(participant);

        // Assert
        Optional<LobbyParticipant> fetched = lobby.getParticipant("p1");
        assertTrue(fetched.isPresent());
        assertEquals("Bob", fetched.get().getName());
        assertEquals(1, lobby.getParticipants().size());
    }

    @DisplayName("Fetching an unknown participant returns an empty optional")
    @Test
    void getUnknownParticipant() {
        // Act & Assert
        assertTrue(lobby.getParticipant("missing").isEmpty());
    }

    @DisplayName("Participants can be removed")
    @Test
    void removeParticipant() {
        // Arrange
        lobby.addParticipant(new LobbyParticipant("Bob", "title", "p1", true, 0));

        // Act
        lobby.removeParticipant("p1");

        // Assert
        assertTrue(lobby.getParticipant("p1").isEmpty());
        assertTrue(lobby.getParticipants().isEmpty());
    }

    @DisplayName("markAsAbandoned flips the abandoned flag")
    @Test
    void markAbandoned() {
        // Act
        lobby.markAsAbandoned();

        // Assert
        assertTrue(lobby.isAbandoned());
    }

    @DisplayName("markAsTransitioning flips the transitioning flag")
    @Test
    void markTransitioning() {
        // Act
        lobby.markAsTransitioning();

        // Assert
        assertTrue(lobby.isTransitioning());
    }
}
