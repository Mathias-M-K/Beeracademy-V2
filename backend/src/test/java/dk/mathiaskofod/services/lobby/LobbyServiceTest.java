package dk.mathiaskofod.services.lobby;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import dk.mathiaskofod.services.game.GameService;
import dk.mathiaskofod.services.lobby.exceptions.LobbyNotEmptyException;
import dk.mathiaskofod.services.lobby.models.Lobby;
import dk.mathiaskofod.services.lobby.models.LobbyParticipant;
import dk.mathiaskofod.services.lobby.repository.LobbyRepository;
import dk.mathiaskofod.services.session.exceptions.CannotIdentifyPlayer;
import dk.mathiaskofod.services.session.repository.Session;
import dk.mathiaskofod.services.session.repository.SessionRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class LobbyServiceTest {

    @Mock
    GameService gameService;

    @Mock
    SessionRegistry sessionRegistry;

    @Mock
    LobbyRepository lobbyRepository;

    @InjectMocks
    LobbyService lobbyService;

    private static final String PARTY_ID = "lobby-123";
    private static final String LOBBY_NAME = "Beer Lobby";

    private Lobby lobby;

    @BeforeEach
    void setUp() {
        lobby = new Lobby(LOBBY_NAME, PARTY_ID);
    }

    @Nested
    @DisplayName("Lobby lifecycle")
    class Lifecycle {

        @DisplayName("createLobby persists the lobby and registers a session")
        @Test
        void createLobbySuccessfully() {
            // Act
            String id = lobbyService.createLobby(LOBBY_NAME);

            // Assert
            assertNotNull(id);
            verify(lobbyRepository).addLobby(any(Lobby.class));
            verify(sessionRegistry).registerSession(any(Session.class));
        }

        @DisplayName("getLobby delegates to the repository")
        @Test
        void getLobbyDelegates() {
            // Arrange
            when(lobbyRepository.getLobby(PARTY_ID)).thenReturn(lobby);

            // Act
            Lobby fetched = lobbyService.getLobby(PARTY_ID);

            // Assert
            assertEquals(lobby, fetched);
        }

        @DisplayName("deleteLobby throws when the lobby still has an active participant")
        @Test
        void deleteLobbyNotEmpty() {
            // Arrange
            lobby.addParticipant(new LobbyParticipant("Bob", "title", "p1", true, 0));
            when(lobbyRepository.getLobby(PARTY_ID)).thenReturn(lobby);

            // Act & Assert
            assertThrows(LobbyNotEmptyException.class, () -> lobbyService.deleteLobby(PARTY_ID, false));
            verify(lobbyRepository, never()).removeLobby(PARTY_ID);
        }

        @DisplayName("deleteLobby removes the session when it should not be preserved")
        @Test
        void deleteLobbyWithoutPreservingSession() {
            // Arrange
            when(lobbyRepository.getLobby(PARTY_ID)).thenReturn(lobby);

            // Act
            lobbyService.deleteLobby(PARTY_ID, false);

            // Assert
            verify(lobbyRepository).removeLobby(PARTY_ID);
            verify(sessionRegistry).removeSession(PARTY_ID);
            verify(sessionRegistry, never()).clearConnectionId(PARTY_ID);
        }

        @DisplayName("deleteLobby preserves the session when requested")
        @Test
        void deleteLobbyPreservingSession() {
            // Arrange
            lobby.addParticipant(new LobbyParticipant("Bob", "title", "p1", false, 0));
            when(lobbyRepository.getLobby(PARTY_ID)).thenReturn(lobby);

            // Act
            lobbyService.deleteLobby(PARTY_ID, true);

            // Assert
            verify(lobbyRepository).removeLobby(PARTY_ID);
            verify(sessionRegistry).clearConnectionId(PARTY_ID);
            verify(sessionRegistry, never()).removeSession(PARTY_ID);
        }

        @DisplayName("markLobbyAsAbandoned flags the lobby")
        @Test
        void markAbandoned() {
            // Arrange
            when(lobbyRepository.getLobby(PARTY_ID)).thenReturn(lobby);

            // Act
            lobbyService.markLobbyAsAbandoned(PARTY_ID);

            // Assert
            assertTrue(lobby.isAbandoned());
        }

        @DisplayName("markLobbyAsTransitioning flags the lobby")
        @Test
        void markTransitioning() {
            // Arrange
            when(lobbyRepository.getLobby(PARTY_ID)).thenReturn(lobby);

            // Act
            lobbyService.markLobbyAsTransitioning(PARTY_ID);

            // Assert
            assertTrue(lobby.isTransitioning());
        }
    }

    @Nested
    @DisplayName("Participant management")
    class Participants {

        @DisplayName("registerParticipant appends a participant at the next position")
        @Test
        void registerParticipantAssignsPosition() {
            // Arrange
            lobby.addParticipant(new LobbyParticipant("Existing", "title", "p0", true, 0));
            when(lobbyRepository.getLobby(PARTY_ID)).thenReturn(lobby);

            // Act
            LobbyParticipant participant = lobbyService.registerParticipant(PARTY_ID, "Bob", "p1", true);

            // Assert
            assertEquals("Bob", participant.getName());
            assertEquals("p1", participant.getId());
            assertEquals(1, participant.getPosition());
            assertEquals(2, lobby.getParticipants().size());
        }

        @DisplayName("removeDisconnectedParticipant deletes an abandoned lobby once empty")
        @Test
        void removeParticipantDeletesAbandonedLobby() {
            // Arrange
            lobby.addParticipant(new LobbyParticipant("Bob", "title", "p1", true, 0));
            lobby.markAsAbandoned();
            when(lobbyRepository.getLobby(PARTY_ID)).thenReturn(lobby);

            // Act
            lobbyService.removeDisconnectedParticipant(PARTY_ID, "p1");

            // Assert
            verify(lobbyRepository).removeLobby(PARTY_ID);
            verify(sessionRegistry).removeSession(PARTY_ID);
        }

        @DisplayName("removeDisconnectedParticipant preserves session for a transitioning lobby once empty")
        @Test
        void removeParticipantDeletesTransitioningLobby() {
            // Arrange
            lobby.addParticipant(new LobbyParticipant("Bob", "title", "p1", true, 0));
            lobby.markAsTransitioning();
            when(lobbyRepository.getLobby(PARTY_ID)).thenReturn(lobby);

            // Act
            lobbyService.removeDisconnectedParticipant(PARTY_ID, "p1");

            // Assert
            verify(lobbyRepository).removeLobby(PARTY_ID);
            verify(sessionRegistry).clearConnectionId(PARTY_ID);
        }

        @DisplayName("removeDisconnectedParticipant keeps the lobby when participants remain")
        @Test
        void removeParticipantKeepsPopulatedLobby() {
            // Arrange
            lobby.addParticipant(new LobbyParticipant("Bob", "title", "p1", true, 0));
            lobby.addParticipant(new LobbyParticipant("Alice", "title", "p2", true, 1));
            lobby.markAsAbandoned();
            when(lobbyRepository.getLobby(PARTY_ID)).thenReturn(lobby);

            // Act
            lobbyService.removeDisconnectedParticipant(PARTY_ID, "p1");

            // Assert
            verify(lobbyRepository, never()).removeLobby(PARTY_ID);
        }

        @DisplayName("changeParticipantPosition updates the participant position")
        @Test
        void changePositionSuccessfully() {
            // Arrange
            LobbyParticipant participant = new LobbyParticipant("Bob", "title", "p1", true, 0);
            lobby.addParticipant(participant);
            when(lobbyRepository.getLobby(PARTY_ID)).thenReturn(lobby);

            // Act
            lobbyService.changeParticipantPosition(PARTY_ID, "p1", 3);

            // Assert
            assertEquals(3, participant.getPosition());
        }

        @DisplayName("changeParticipantPosition throws when the participant is unknown")
        @Test
        void changePositionUnknownParticipant() {
            // Arrange
            when(lobbyRepository.getLobby(PARTY_ID)).thenReturn(lobby);

            // Act & Assert
            assertThrows(
                    CannotIdentifyPlayer.class, () -> lobbyService.changeParticipantPosition(PARTY_ID, "missing", 1));
        }
    }

    @Nested
    @DisplayName("Game creation")
    class GameCreation {

        @DisplayName("createGame maps participants to players and delegates to the game service")
        @Test
        void createGameSuccessfully() {
            // Arrange
            lobby.addParticipant(new LobbyParticipant("Bob", "title", "p1", true, 0));
            lobby.addParticipant(new LobbyParticipant("Alice", "title", "p2", true, 1));
            when(lobbyRepository.getLobby(PARTY_ID)).thenReturn(lobby);

            // Act
            lobbyService.createGame(PARTY_ID);

            // Assert
            verify(gameService).createGame(eq(LOBBY_NAME), eq(PARTY_ID), anyList());
        }
    }
}
