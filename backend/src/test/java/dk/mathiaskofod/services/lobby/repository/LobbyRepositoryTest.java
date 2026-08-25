package dk.mathiaskofod.services.lobby.repository;

import static org.junit.jupiter.api.Assertions.*;

import dk.mathiaskofod.services.lobby.exceptions.LobbyNotFoundException;
import dk.mathiaskofod.services.lobby.models.Lobby;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class LobbyRepositoryTest {

    @InjectMocks
    LobbyRepository lobbyRepository;

    @Test
    @DisplayName("Lobby can be added and fetched")
    void lobbyCanBeSavedAndFetched() {

        // Arrange
        String partyId = "test-lobby-id";
        Lobby lobby = new Lobby("Test Lobby", partyId);

        // Act
        lobbyRepository.addLobby(lobby);
        Lobby fetchedLobby = lobbyRepository.getLobby(partyId);

        // Assert
        assertNotNull(fetchedLobby);
        assertEquals(partyId, fetchedLobby.getId());
        assertEquals("Test Lobby", fetchedLobby.getName());
    }

    @Test
    @DisplayName("Exception is thrown when attempting to fetch non-existing lobby")
    void lobbyCanNotBeFetchedIfLobbyNotFound() {

        // Arrange
        String partyId = "non-existing-lobby-id";

        // Act & Assert
        assertThrows(LobbyNotFoundException.class, () -> lobbyRepository.getLobby(partyId));
    }
}
