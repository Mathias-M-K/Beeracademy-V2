package dk.mathiaskofod.websocket.lobby;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import dk.mathiaskofod.providers.exceptions.mappers.ExceptionResponse;
import dk.mathiaskofod.services.auth.models.CustomJwtClaims;
import dk.mathiaskofod.services.auth.models.Role;
import dk.mathiaskofod.services.auth.models.TokenInfo;
import dk.mathiaskofod.services.lobby.exceptions.LobbyNotFoundException;
import dk.mathiaskofod.services.session.LobbyClientSessionManager;
import dk.mathiaskofod.services.session.LobbyParticipantSessionManager;
import dk.mathiaskofod.services.session.envelopes.GameClientEventEnvelope;
import dk.mathiaskofod.services.session.envelopes.WebsocketEnvelope;
import dk.mathiaskofod.services.session.events.common.ExceptionEvent;
import dk.mathiaskofod.services.session.exceptions.SessionNotFoundException;
import dk.mathiaskofod.websocket.game.models.WebsocketCodes;
import io.quarkus.websockets.next.CloseReason;
import io.quarkus.websockets.next.WebSocketConnection;
import java.util.Set;
import org.eclipse.microprofile.jwt.JsonWebToken;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class LobbyWebsocketTest {

    @Mock
    JsonWebToken jwt;

    @Mock
    LobbyClientSessionManager lobbyClientSessionManager;

    @Mock
    LobbyParticipantSessionManager lobbyParticipantSessionManager;

    @Mock
    WebSocketConnection connection;

    LobbyWebsocket websocket;

    private static final String CONN_ID = "conn-1";
    private static final String GAME_ID = "lobby-1";

    @BeforeEach
    void setUp() {
        websocket = new LobbyWebsocket();
        websocket.jwt = jwt;
        websocket.lobbyClientSessionManager = lobbyClientSessionManager;
        websocket.lobbyParticipantSessionManager = lobbyParticipantSessionManager;
        websocket.connection = connection;

        when(connection.id()).thenReturn(CONN_ID);
        when(jwt.<String>getClaim(CustomJwtClaims.GAME_ID.getName())).thenReturn(GAME_ID);
    }

    private void asRole(Role role) {
        when(jwt.getGroups()).thenReturn(Set.of(role.toString()));
        when(jwt.<String>getClaim(CustomJwtClaims.PLAYER_ID.getName())).thenReturn("player-1");
    }

    @DisplayName("onOpen routes a lobby-client connection to the client session manager")
    @Test
    void onOpenClient() {
        // Arrange
        asRole(Role.GAME_CLIENT);

        // Act
        websocket.onOpen();

        // Assert
        verify(lobbyClientSessionManager).onNewConnection(eq(CONN_ID), any(TokenInfo.class));
    }

    @DisplayName("onOpen routes a participant connection to the participant session manager")
    @Test
    void onOpenParticipant() {
        // Arrange
        asRole(Role.PLAYER_CLIENT);

        // Act
        websocket.onOpen();

        // Assert
        verify(lobbyParticipantSessionManager).onNewConnection(eq(CONN_ID), any(TokenInfo.class));
    }

    @DisplayName("onClose delegates to the resolved session manager")
    @Test
    void onClose() {
        // Arrange
        asRole(Role.GAME_CLIENT);
        CloseReason reason = new CloseReason(3000, "bye");

        // Act
        websocket.onClose(reason);

        // Assert
        verify(lobbyClientSessionManager).onConnectionClosed(any(TokenInfo.class), eq(reason));
    }

    @DisplayName("onMessage delegates to the resolved session manager")
    @Test
    void onMessage() {
        // Arrange
        asRole(Role.PLAYER_CLIENT);
        WebsocketEnvelope<?> message = mock(WebsocketEnvelope.class);

        // Act
        websocket.onMessage(message);

        // Assert
        verify(lobbyParticipantSessionManager).onMessage(any(TokenInfo.class), eq(message));
    }

    @DisplayName("onError reports the error and closes the connection when the lobby is not found")
    @Test
    void onErrorLobbyNotFound() {
        // Arrange
        LobbyNotFoundException error = new LobbyNotFoundException(GAME_ID);

        // Act
        websocket.onError(error);

        // Assert
        verify(connection).sendTextAndAwait(any(GameClientEventEnvelope.class));
        assertEquals(WebsocketCodes.LOBBY_NOT_FOUND.getCode(), capturedCloseCode());
    }

    @DisplayName("onError reports the error and closes the connection when the session is not found")
    @Test
    void onErrorSessionNotFound() {
        // Arrange
        SessionNotFoundException error = new SessionNotFoundException(CONN_ID);

        // Act
        websocket.onError(error);

        // Assert
        verify(connection).sendTextAndAwait(any(GameClientEventEnvelope.class));
        assertEquals(WebsocketCodes.SESSION_NOT_FOUND.getCode(), capturedCloseCode());
    }

    @DisplayName("onError sends the exception details wrapped in a game-client event envelope")
    @Test
    void onErrorSendsExceptionEvent() {
        // Arrange
        RuntimeException error = new RuntimeException("boom", new IllegalStateException("root cause"));

        // Act
        websocket.onError(error);

        // Assert
        ArgumentCaptor<GameClientEventEnvelope> captor = ArgumentCaptor.forClass(GameClientEventEnvelope.class);
        verify(connection).sendTextAndAwait(captor.capture());

        ExceptionResponse response = ((ExceptionEvent) captor.getValue().payload()).response();
        assertEquals(RuntimeException.class.getSimpleName(), response.exception());
        assertEquals(IllegalStateException.class.getSimpleName(), response.cause());
        assertEquals("boom", response.message());
    }

    @DisplayName("onError reports other errors without closing the connection")
    @Test
    void onErrorGeneric() {
        // Arrange
        RuntimeException error = new RuntimeException("boom");

        // Act
        websocket.onError(error);

        // Assert
        verify(connection).sendTextAndAwait(any(GameClientEventEnvelope.class));
        verify(connection, never()).closeAndAwait(any(CloseReason.class));
    }

    private int capturedCloseCode() {
        ArgumentCaptor<CloseReason> captor = ArgumentCaptor.forClass(CloseReason.class);
        verify(connection).closeAndAwait(captor.capture());
        return captor.getValue().getCode();
    }
}
