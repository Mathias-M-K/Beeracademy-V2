package dk.mathiaskofod.services.session;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import dk.mathiaskofod.services.auth.models.Role;
import dk.mathiaskofod.services.auth.models.TokenInfo;
import dk.mathiaskofod.services.game.GameService;
import dk.mathiaskofod.services.lobby.LobbyService;
import dk.mathiaskofod.services.lobby.models.Emoji;
import dk.mathiaskofod.services.lobby.models.Lobby;
import dk.mathiaskofod.services.lobby.models.LobbyParticipant;
import dk.mathiaskofod.services.session.actions.lobby.client.AddParticipantAction;
import dk.mathiaskofod.services.session.actions.lobby.client.RearrangeParticipantsAction;
import dk.mathiaskofod.services.session.actions.lobby.client.RemoveParticipantAction;
import dk.mathiaskofod.services.session.actions.lobby.client.StartGameAction;
import dk.mathiaskofod.services.session.actions.lobby.common.SendEmojiAction;
import dk.mathiaskofod.services.session.actions.lobby.common.SendMessageAction;
import dk.mathiaskofod.services.session.actions.lobby.common.UpdateSettingsAction;
import dk.mathiaskofod.services.session.envelopes.LobbyClientActionEnvelope;
import dk.mathiaskofod.services.session.envelopes.WebsocketEnvelope;
import dk.mathiaskofod.services.session.exceptions.CannotIdentifyPlayerException;
import dk.mathiaskofod.services.session.exceptions.UnknownCategoryException;
import dk.mathiaskofod.services.session.repository.Session;
import dk.mathiaskofod.services.session.repository.SessionRegistry;
import dk.mathiaskofod.websocket.game.models.WebsocketCodes;
import io.quarkus.websockets.next.CloseReason;
import io.quarkus.websockets.next.OpenConnections;
import io.quarkus.websockets.next.WebSocketConnection;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class LobbyClientSessionManagerTest {

    @Mock
    SessionRegistry sessionRegistry;

    @Mock
    GameService gameService;

    @Mock
    LobbyService lobbyService;

    @Mock
    OpenConnections connections;

    @Mock
    TokenInfo tokenInfo;

    LobbyClientSessionManager sessionManager;

    private static final String PARTY_ID = "lobby-123";
    private static final String CONN_ID = "conn-456";

    private Lobby lobby;

    @BeforeEach
    void setUp() {
        sessionManager = new LobbyClientSessionManager();
        sessionManager.sessionRegistry = sessionRegistry;
        sessionManager.gameService = gameService;
        sessionManager.lobbyService = lobbyService;
        sessionManager.connections = connections;

        lobby = new Lobby("My Lobby", PARTY_ID);

        when(tokenInfo.getPartyId()).thenReturn(PARTY_ID);
        when(tokenInfo.getClientId()).thenReturn(PARTY_ID);
        when(tokenInfo.getRole()).thenReturn(Role.GAME_CLIENT);
        when(lobbyService.getLobby(PARTY_ID)).thenReturn(lobby);
    }

    /** Registers an active websocket connection for the given session id and returns the mocked connection. */
    private WebSocketConnection mockActiveConnection(String sessionId) {
        String connectionId = "ws-" + sessionId;
        Session session = mock(Session.class);
        when(session.getSessionId()).thenReturn(sessionId);
        when(session.getConnectionId()).thenReturn(Optional.of(connectionId));
        when(sessionRegistry.getSession(sessionId)).thenReturn(Optional.of(session));

        WebSocketConnection connection = mock(WebSocketConnection.class);
        when(connections.findByConnectionId(connectionId)).thenReturn(Optional.of(connection));
        return connection;
    }

    @Nested
    @DisplayName("Connection lifecycle")
    class ConnectionLifecycle {

        @DisplayName("onNewConnection stores the connection id and pushes snapshot + identity")
        @Test
        void newConnectionSuccessfully() {
            // Arrange
            WebSocketConnection clientConnection = mockActiveConnection(PARTY_ID);

            // Act
            sessionManager.onNewConnection(CONN_ID, tokenInfo);

            // Assert
            verify(sessionRegistry).setConnectionId(PARTY_ID, CONN_ID);
            verify(clientConnection, atLeastOnce()).sendTextAndAwait(any(WebsocketEnvelope.class));
        }

        @DisplayName("onConnectionClosed marks the lobby abandoned and disconnects active participants")
        @Test
        void connectionClosedAbandoned() {
            // Arrange
            lobby.addParticipant(new LobbyParticipant("Bob", "title", "p1", true, 0));
            WebSocketConnection participantConnection = mockActiveConnection("p1");
            CloseReason reason = new CloseReason(3000, "client gone");

            // Act
            sessionManager.onConnectionClosed(tokenInfo, reason);

            // Assert
            verify(lobbyService).markLobbyAsAbandoned(PARTY_ID);
            verify(participantConnection).closeAndAwait(any(CloseReason.class));
        }

        @DisplayName("onConnectionClosed with the transitioning code marks the lobby as transitioning")
        @Test
        void connectionClosedTransitioning() {
            // Arrange
            lobby.addParticipant(new LobbyParticipant("Bob", "title", "p1", true, 0));
            WebSocketConnection participantConnection = mockActiveConnection("p1");
            CloseReason reason = new CloseReason(WebsocketCodes.TRANSITIONING.getCode());

            // Act
            sessionManager.onConnectionClosed(tokenInfo, reason);

            // Assert
            verify(lobbyService).markLobbyAsTransitioning(PARTY_ID);
            verify(sessionRegistry).clearConnectionId(PARTY_ID);
            verify(participantConnection).closeAndAwait(any(CloseReason.class));
        }
    }

    @Nested
    @DisplayName("Message handling")
    class MessageHandling {

        @DisplayName("onMessage rejects an envelope that is not a lobby client action")
        @Test
        void invalidEnvelope() {
            // Arrange
            WebsocketEnvelope<?> invalid = mock(WebsocketEnvelope.class);

            // Act & Assert
            assertThrows(UnknownCategoryException.class, () -> sessionManager.onMessage(tokenInfo, invalid));
        }

        @DisplayName("AddParticipantAction registers a client-created participant")
        @Test
        void addParticipant() {
            // Arrange
            mockActiveConnection(PARTY_ID);
            LobbyParticipant registered = new LobbyParticipant("Bob", "title", "p1", false, 0);
            when(lobbyService.registerParticipant(eq(PARTY_ID), eq("Bob"), anyString(), eq(false)))
                    .thenReturn(registered);

            // Act
            sessionManager.onMessage(tokenInfo, new LobbyClientActionEnvelope(new AddParticipantAction("Bob")));

            // Assert
            verify(lobbyService).registerParticipant(eq(PARTY_ID), eq("Bob"), anyString(), eq(false));
        }

        @DisplayName("RemoveParticipantAction disconnects an active participant")
        @Test
        void removeActiveParticipant() {
            // Arrange
            mockActiveConnection(PARTY_ID);
            WebSocketConnection participantConnection = mockActiveConnection("p1");

            // Act
            sessionManager.onMessage(tokenInfo, new LobbyClientActionEnvelope(new RemoveParticipantAction("p1")));

            // Assert
            verify(participantConnection).closeAndAwait(any(CloseReason.class));
        }

        @DisplayName("RemoveParticipantAction removes an inactive participant from the lobby")
        @Test
        void removeInactiveParticipant() {
            // Arrange
            mockActiveConnection(PARTY_ID);
            when(sessionRegistry.getSession("p1")).thenReturn(Optional.empty());

            // Act
            sessionManager.onMessage(tokenInfo, new LobbyClientActionEnvelope(new RemoveParticipantAction("p1")));

            // Assert
            verify(lobbyService).removeDisconnectedParticipant(PARTY_ID, "p1");
        }

        @DisplayName("StartGameAction creates the game and closes the connection to transition")
        @Test
        void startGame() {
            // Arrange
            WebSocketConnection clientConnection = mockActiveConnection(PARTY_ID);

            // Act
            sessionManager.onMessage(tokenInfo, new LobbyClientActionEnvelope(new StartGameAction()));

            // Assert
            verify(lobbyService).createGame(PARTY_ID);
            verify(clientConnection).closeAndAwait(any(CloseReason.class));
        }

        @DisplayName("UpdateSettingsAction applies the settings to the target participant")
        @Test
        void updateSettings() {
            // Arrange
            mockActiveConnection(PARTY_ID);
            mockActiveConnection("p1");
            LobbyParticipant participant = new LobbyParticipant("Bob", "title", "p1", true, 0);
            lobby.addParticipant(participant);
            UpdateSettingsAction action = new UpdateSettingsAction("p1", 7, false);

            // Act
            sessionManager.onMessage(tokenInfo, new LobbyClientActionEnvelope(action));

            // Assert
            assertEquals(7, participant.getSipsInABeer());
            assertFalse(participant.canDrawAce());
        }

        @DisplayName("UpdateSettingsAction without a target participant is rejected")
        @Test
        void updateSettingsNoTarget() {
            // Arrange
            UpdateSettingsAction action = new UpdateSettingsAction(null, 7, false);
            LobbyClientActionEnvelope envelope = new LobbyClientActionEnvelope(action);

            // Act & Assert
            assertThrows(CannotIdentifyPlayerException.class, () -> sessionManager.onMessage(tokenInfo, envelope));
        }

        @DisplayName("SendEmojiAction broadcasts to the lobby participants")
        @Test
        void sendEmoji() {
            // Arrange
            lobby.addParticipant(new LobbyParticipant("Bob", "title", "p1", true, 0));
            mockActiveConnection(PARTY_ID);
            WebSocketConnection participantConnection = mockActiveConnection("p1");

            // Act
            sessionManager.onMessage(tokenInfo, new LobbyClientActionEnvelope(new SendEmojiAction(Emoji.BEER)));

            // Assert
            verify(participantConnection).sendTextAndAwait(any(WebsocketEnvelope.class));
        }

        @DisplayName("SendMessageAction broadcasts to the lobby participants")
        @Test
        void sendMessage() {
            // Arrange
            lobby.addParticipant(new LobbyParticipant("Bob", "title", "p1", true, 0));
            mockActiveConnection(PARTY_ID);
            WebSocketConnection participantConnection = mockActiveConnection("p1");

            // Act
            sessionManager.onMessage(tokenInfo, new LobbyClientActionEnvelope(new SendMessageAction("hello")));

            // Assert
            verify(participantConnection).sendTextAndAwait(any(WebsocketEnvelope.class));
        }

        @DisplayName("RearrangeParticipantsAction changes each supplied participant position")
        @Test
        void rearrangeParticipants() {
            // Arrange
            mockActiveConnection(PARTY_ID);
            RearrangeParticipantsAction action = new RearrangeParticipantsAction(List.of(
                    new RearrangeParticipantsAction.ParticipantPosition("p1", 1),
                    new RearrangeParticipantsAction.ParticipantPosition("p2", 0)));

            // Act
            sessionManager.onMessage(tokenInfo, new LobbyClientActionEnvelope(action));

            // Assert
            verify(lobbyService).changeParticipantPosition(PARTY_ID, "p1", 1);
            verify(lobbyService).changeParticipantPosition(PARTY_ID, "p2", 0);
        }
    }
}
