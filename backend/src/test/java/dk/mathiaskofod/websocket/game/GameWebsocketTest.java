package dk.mathiaskofod.websocket.game;

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
import dk.mathiaskofod.services.game.exceptions.GameNotFoundException;
import dk.mathiaskofod.services.session.GameClientSessionManager;
import dk.mathiaskofod.services.session.PlayerClientSessionManager;
import dk.mathiaskofod.services.session.envelopes.WebsocketEnvelope;
import dk.mathiaskofod.websocket.game.models.CustomWebsocketCodes;
import io.quarkus.websockets.next.CloseReason;
import io.quarkus.websockets.next.WebSocketConnection;
import java.util.Set;
import org.eclipse.microprofile.jwt.JsonWebToken;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class GameWebsocketTest {

    @Mock
    JsonWebToken jwt;

    @Mock
    WebSocketConnection connection;

    @Mock
    PlayerClientSessionManager playerClientSessionManager;

    @Mock
    GameClientSessionManager gameClientSessionManager;

    GameWebsocket websocket;

    private static final String CONN_ID = "conn-1";
    private static final String GAME_ID = "game-1";

    @BeforeEach
    void setUp() {
        websocket = new GameWebsocket();
        websocket.jwt = jwt;
        websocket.connection = connection;
        websocket.playerClientSessionManager = playerClientSessionManager;
        websocket.gameClientSessionManager = gameClientSessionManager;

        when(connection.id()).thenReturn(CONN_ID);
        when(jwt.<String>getClaim(CustomJwtClaims.GAME_ID.getName())).thenReturn(GAME_ID);
    }

    private void asRole(Role role) {
        when(jwt.getGroups()).thenReturn(Set.of(role.toString()));
        when(jwt.<String>getClaim(CustomJwtClaims.PLAYER_ID.getName())).thenReturn("player-1");
    }

    @DisplayName("onOpen routes a game-client connection to the game-client session manager")
    @Test
    void onOpenGameClient() {
        // Arrange
        asRole(Role.GAME_CLIENT);

        // Act
        websocket.onNewWebsocketConnection();

        // Assert
        verify(gameClientSessionManager).onNewConnection(eq(CONN_ID), any(TokenInfo.class));
    }

    @DisplayName("onOpen routes a player-client connection to the player session manager")
    @Test
    void onOpenPlayerClient() {
        // Arrange
        asRole(Role.PLAYER_CLIENT);

        // Act
        websocket.onNewWebsocketConnection();

        // Assert
        verify(playerClientSessionManager).onNewConnection(eq(CONN_ID), any(TokenInfo.class));
    }

    @DisplayName("onClose delegates to the resolved session manager")
    @Test
    void onCloseDelegates() {
        // Arrange
        asRole(Role.GAME_CLIENT);
        CloseReason reason = new CloseReason(3000, "bye");

        // Act
        websocket.onWebsocketConnectionClosed(reason);

        // Assert
        verify(gameClientSessionManager).onConnectionClosed(any(TokenInfo.class), eq(reason));
    }

    @DisplayName("onClose is a no-op for the session-not-found code")
    @Test
    void onCloseSessionNotFound() {
        // Arrange
        asRole(Role.GAME_CLIENT);
        CloseReason reason = new CloseReason(CustomWebsocketCodes.SESSION_NOT_FOUND.getCode());

        // Act
        websocket.onWebsocketConnectionClosed(reason);

        // Assert
        verify(gameClientSessionManager, never()).onConnectionClosed(any(), any());
    }

    @DisplayName("onMessage delegates to the resolved session manager")
    @Test
    void onMessageDelegates() {
        // Arrange
        asRole(Role.PLAYER_CLIENT);
        WebsocketEnvelope<?> message = mock(WebsocketEnvelope.class);

        // Act
        websocket.onTextMessage(message);

        // Assert
        verify(playerClientSessionManager).onMessage(any(TokenInfo.class), eq(message));
    }

    @DisplayName("onError reports the error and closes the connection when the game is not found")
    @Test
    void onErrorGameNotFound() {
        // Arrange
        GameNotFoundException error = new GameNotFoundException(GAME_ID);

        // Act
        websocket.onError(error);

        // Assert
        verify(connection).sendTextAndAwait(any(ExceptionResponse.class));
        verify(connection).closeAndAwait(any(CloseReason.class));
    }

    @DisplayName("onError reports other errors without closing the connection")
    @Test
    void onErrorGeneric() {
        // Arrange
        RuntimeException error = new RuntimeException("boom");

        // Act
        websocket.onError(error);

        // Assert
        verify(connection).sendTextAndAwait(any(ExceptionResponse.class));
        verify(connection, never()).closeAndAwait(any(CloseReason.class));
    }
}
