package dk.mathiaskofod.services.session;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import dk.mathiaskofod.services.auth.models.Role;
import dk.mathiaskofod.services.auth.models.TokenInfo;
import dk.mathiaskofod.services.game.GameService;
import dk.mathiaskofod.services.lobby.LobbyService;
import dk.mathiaskofod.services.lobby.models.Emoji;
import dk.mathiaskofod.services.lobby.models.Lobby;
import dk.mathiaskofod.services.lobby.models.LobbyParticipant;
import dk.mathiaskofod.services.session.actions.lobby.common.SendEmojiAction;
import dk.mathiaskofod.services.session.actions.lobby.common.SendMessageAction;
import dk.mathiaskofod.services.session.actions.lobby.common.UpdateSettingsAction;
import dk.mathiaskofod.services.session.envelopes.LobbyParticipantActionEnvelope;
import dk.mathiaskofod.services.session.envelopes.WebsocketEnvelope;
import dk.mathiaskofod.services.session.exceptions.UnknownCategoryException;
import dk.mathiaskofod.services.session.repository.Session;
import dk.mathiaskofod.services.session.repository.SessionRegistry;
import dk.mathiaskofod.websocket.game.models.CustomWebsocketCodes;
import io.quarkus.websockets.next.CloseReason;
import io.quarkus.websockets.next.OpenConnections;
import io.quarkus.websockets.next.WebSocketConnection;
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
class LobbyParticipantSessionManagerTest {

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

    LobbyParticipantSessionManager sessionManager;

    private static final String LOBBY_ID = "lobby-123";
    private static final String PLAYER_ID = "p1";
    private static final String CONN_ID = "conn-456";

    private Lobby lobby;

    @BeforeEach
    void setUp() {
        sessionManager = new LobbyParticipantSessionManager();
        sessionManager.sessionRegistry = sessionRegistry;
        sessionManager.gameService = gameService;
        sessionManager.lobbyService = lobbyService;
        sessionManager.connections = connections;

        lobby = new Lobby("My Lobby", LOBBY_ID);

        when(tokenInfo.getGameId()).thenReturn(LOBBY_ID);
        when(tokenInfo.getPlayerId()).thenReturn(PLAYER_ID);
        when(tokenInfo.getName()).thenReturn("Bob");
        when(tokenInfo.getClientId()).thenReturn(PLAYER_ID);
        when(tokenInfo.getRole()).thenReturn(Role.PLAYER_CLIENT);
        when(lobbyService.getLobby(LOBBY_ID)).thenReturn(lobby);
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

        @DisplayName("onNewConnection registers the participant and its session")
        @Test
        void newConnectionSuccessfully() {
            // Arrange
            mockActiveConnection(LOBBY_ID);
            mockActiveConnection(PLAYER_ID);
            LobbyParticipant participant = new LobbyParticipant("Bob", "title", PLAYER_ID, true, 0);
            when(lobbyService.registerParticipant(LOBBY_ID, "Bob", PLAYER_ID, true))
                    .thenReturn(participant);

            // Act
            sessionManager.onNewConnection(CONN_ID, tokenInfo);

            // Assert
            verify(lobbyService).registerParticipant(LOBBY_ID, "Bob", PLAYER_ID, true);
            verify(sessionRegistry).registerSession(any(Session.class));
        }

        @DisplayName("onConnectionClosed on a normal close removes the session and broadcasts")
        @Test
        void connectionClosedNormal() {
            // Arrange
            WebSocketConnection clientConnection = mockActiveConnection(LOBBY_ID);
            CloseReason reason = new CloseReason(3000, "bye");

            // Act
            sessionManager.onConnectionClosed(tokenInfo, reason);

            // Assert
            verify(lobbyService).removeDisconnectedParticipant(LOBBY_ID, PLAYER_ID);
            verify(sessionRegistry).removeSession(PLAYER_ID);
            verify(clientConnection).sendTextAndAwait(any(WebsocketEnvelope.class));
        }

        @DisplayName("onConnectionClosed while transitioning preserves the session and skips broadcast")
        @Test
        void connectionClosedTransitioning() {
            // Arrange
            WebSocketConnection clientConnection = mockActiveConnection(LOBBY_ID);
            CloseReason reason = new CloseReason(CustomWebsocketCodes.TRANSITIONING.getCode());

            // Act
            sessionManager.onConnectionClosed(tokenInfo, reason);

            // Assert
            verify(sessionRegistry).clearConnectionId(PLAYER_ID);
            verify(sessionRegistry, never()).removeSession(PLAYER_ID);
            verify(clientConnection, never()).sendTextAndAwait(any(WebsocketEnvelope.class));
        }

        @DisplayName("onConnectionClosed after the leader left removes the session but skips broadcast")
        @Test
        void connectionClosedLeaderLeft() {
            // Arrange
            WebSocketConnection clientConnection = mockActiveConnection(LOBBY_ID);
            CloseReason reason = new CloseReason(CustomWebsocketCodes.LOBBY_LEADER_LEFT.getCode(), "leader left");

            // Act
            sessionManager.onConnectionClosed(tokenInfo, reason);

            // Assert
            verify(sessionRegistry).removeSession(PLAYER_ID);
            verify(clientConnection, never()).sendTextAndAwait(any(WebsocketEnvelope.class));
        }
    }

    @Nested
    @DisplayName("Message handling")
    class MessageHandling {

        @DisplayName("onMessage rejects an envelope that is not a lobby participant action")
        @Test
        void invalidEnvelope() {
            // Arrange
            WebsocketEnvelope<?> invalid = mock(WebsocketEnvelope.class);

            // Act & Assert
            assertThrows(UnknownCategoryException.class, () -> sessionManager.onMessage(tokenInfo, invalid));
        }

        @DisplayName("SendEmojiAction broadcasts to the lobby client")
        @Test
        void sendEmoji() {
            // Arrange
            WebSocketConnection clientConnection = mockActiveConnection(LOBBY_ID);

            // Act
            sessionManager.onMessage(tokenInfo, new LobbyParticipantActionEnvelope(new SendEmojiAction(Emoji.FIRE)));

            // Assert
            verify(clientConnection).sendTextAndAwait(any(WebsocketEnvelope.class));
        }

        @DisplayName("SendMessageAction broadcasts to the lobby client")
        @Test
        void sendMessage() {
            // Arrange
            WebSocketConnection clientConnection = mockActiveConnection(LOBBY_ID);

            // Act
            sessionManager.onMessage(tokenInfo, new LobbyParticipantActionEnvelope(new SendMessageAction("hi there")));

            // Assert
            verify(clientConnection).sendTextAndAwait(any(WebsocketEnvelope.class));
        }

        @DisplayName("UpdateSettingsAction applies the settings to the acting participant")
        @Test
        void updateSettings() {
            // Arrange
            mockActiveConnection(LOBBY_ID);
            mockActiveConnection(PLAYER_ID);
            LobbyParticipant participant = new LobbyParticipant("Bob", "title", PLAYER_ID, true, 0);
            lobby.addParticipant(participant);
            UpdateSettingsAction action = new UpdateSettingsAction(PLAYER_ID, 3, false);

            // Act
            sessionManager.onMessage(tokenInfo, new LobbyParticipantActionEnvelope(action));

            // Assert
            assertEquals(3, participant.getSipsInABeer());
            assertFalse(participant.canDrawAce());
        }
    }
}
