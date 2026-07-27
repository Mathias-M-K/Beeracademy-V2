package dk.mathiaskofod.services.session;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import dk.mathiaskofod.common.dto.game.GameDto;
import dk.mathiaskofod.domain.game.Game;
import dk.mathiaskofod.domain.game.exceptions.GameException;
import dk.mathiaskofod.domain.game.player.Player;
import dk.mathiaskofod.services.auth.models.TokenInfo;
import dk.mathiaskofod.services.game.GameService;
import dk.mathiaskofod.services.game.GameSessionService;
import dk.mathiaskofod.services.lobby.LobbyService;
import dk.mathiaskofod.services.session.actions.game.common.DrawCardAction;
import dk.mathiaskofod.services.session.actions.game.player.RelinquishPlayerAction;
import dk.mathiaskofod.services.session.envelopes.PlayerClientActionEnvelope;
import dk.mathiaskofod.services.session.envelopes.WebsocketEnvelope;
import dk.mathiaskofod.services.session.exceptions.SessionNotFoundException;
import dk.mathiaskofod.services.session.exceptions.UnknownCategoryException;
import dk.mathiaskofod.services.session.repository.Session;
import dk.mathiaskofod.services.session.repository.SessionRegistry;
import io.quarkus.websockets.next.OpenConnections;
import io.quarkus.websockets.next.WebSocketConnection;
import java.util.Collections;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class PlayerClientSessionManagerTest {

    @Mock
    SessionRegistry sessionRegistry;

    @Mock
    GameService gameService;

    @Mock
    LobbyService lobbyService;

    @Mock
    OpenConnections connections;

    @Mock
    GameSessionService gameSessionService;

    @Mock
    TokenInfo tokenInfo;

    PlayerClientSessionManager sessionManager;

    private static final String GAME_ID = "game-123";
    private static final String PLAYER_ID = "player-p1";
    private static final String CONN_ID = "websocket-conn-456";
    private static final String GAME_CONN_ID = "websocket-conn-game";

    @BeforeEach
    void setUp() {
        sessionManager = new PlayerClientSessionManager();
        sessionManager.sessionRegistry = sessionRegistry;
        sessionManager.gameService = gameService;
        sessionManager.lobbyService = lobbyService;
        sessionManager.connections = connections;
        sessionManager.gameSessionService = gameSessionService;
    }

    private void mockActiveWebsocketConnection(String sessionId) {
        Session session = mock(Session.class);
        when(sessionRegistry.getSession(sessionId)).thenReturn(Optional.of(session));
        when(session.getConnectionId()).thenReturn(Optional.of(CONN_ID));

        WebSocketConnection connection = mock(WebSocketConnection.class);
        when(connections.findByConnectionId(CONN_ID)).thenReturn(Optional.of(connection));
    }

    /**
     * Sets up a connected game-client as the sole party member so broadcastToParty delivers to it.
     *
     * @return the game-client's websocket connection, for verifying the broadcast was delivered
     */
    private WebSocketConnection mockConnectedGameClient() {
        Session gameClientSession = mock(Session.class);
        when(sessionRegistry.getSession(GAME_ID)).thenReturn(Optional.of(gameClientSession));
        when(gameClientSession.isConnected()).thenReturn(true);
        when(gameClientSession.getSessionId()).thenReturn(GAME_ID);
        when(gameClientSession.getConnectionId()).thenReturn(Optional.of(GAME_CONN_ID));

        Game game = mock(Game.class);
        when(game.getPlayers()).thenReturn(Collections.emptyList());
        when(gameService.getGame(GAME_ID)).thenReturn(game);

        WebSocketConnection gameClientConnection = mock(WebSocketConnection.class);
        when(connections.findByConnectionId(GAME_CONN_ID)).thenReturn(Optional.of(gameClientConnection));
        return gameClientConnection;
    }

    @Nested
    @DisplayName("Connection Lifecycle Tests")
    class ConnectionLifecycle {

        @DisplayName("onNewConnection stages connection and broadcasts player event")
        @Test
        void newConnectionSuccessfully() {
            // Arrange
            when(tokenInfo.getGameId()).thenReturn(GAME_ID);
            when(tokenInfo.getPlayerId()).thenReturn(PLAYER_ID);
            when(tokenInfo.getClientId()).thenReturn(PLAYER_ID);
            when(gameSessionService.getGameView(GAME_ID)).thenReturn(mock(GameDto.class));

            WebSocketConnection gameClientConnection = mockConnectedGameClient();
            mockActiveWebsocketConnection(PLAYER_ID);

            // Act
            sessionManager.onNewConnection(CONN_ID, tokenInfo);

            // Assert
            verify(sessionRegistry).setConnectionId(PLAYER_ID, CONN_ID);
            verify(gameClientConnection).sendTextAndAwait(any(WebsocketEnvelope.class));
        }

        @DisplayName("onConnectionClosed clears connection and broadcasts player event")
        @Test
        void connectionClosedSuccessfully() {
            // Arrange
            when(tokenInfo.getGameId()).thenReturn(GAME_ID);
            when(tokenInfo.getPlayerId()).thenReturn(PLAYER_ID);

            WebSocketConnection gameClientConnection = mockConnectedGameClient();

            // Act
            sessionManager.onConnectionClosed(tokenInfo, null);

            // Assert
            verify(sessionRegistry).clearConnectionId(PLAYER_ID);
            verify(gameClientConnection).sendTextAndAwait(any(WebsocketEnvelope.class));
        }
    }

    @Nested
    @DisplayName("Relinquish Player Tests")
    class RelinquishPlayer {

        @DisplayName("relinquishPlayer throws SessionNotFoundException if player session not registered")
        @Test
        void relinquishSessionNotFound() {
            // Arrange
            when(sessionRegistry.getSession(PLAYER_ID)).thenReturn(Optional.empty());

            // Act & Assert
            assertThrows(SessionNotFoundException.class, () -> sessionManager.relinquishPlayer(GAME_ID, PLAYER_ID));
        }

        @DisplayName("relinquishPlayer closes connection, removes session, and broadcasts event")
        @Test
        void relinquishPlayerSuccessfully() {
            // Arrange
            mockActiveWebsocketConnection(PLAYER_ID);
            WebSocketConnection gameClientConnection = mockConnectedGameClient();

            // Act
            sessionManager.relinquishPlayer(GAME_ID, PLAYER_ID);

            // Assert
            verify(sessionRegistry).removeSession(PLAYER_ID);
            verify(gameClientConnection).sendTextAndAwait(any(WebsocketEnvelope.class));
        }
    }

    @Nested
    @DisplayName("Action Message Handler Tests")
    class MessageHandling {

        @DisplayName("onMessage throws UnknownCategoryException if not PlayerClientActionEnvelope")
        @Test
        void invalidEnvelopeType() {
            // Arrange
            WebsocketEnvelope<?> invalidEnvelope = mock(WebsocketEnvelope.class);

            // Act & Assert
            assertThrows(UnknownCategoryException.class, () -> sessionManager.onMessage(tokenInfo, invalidEnvelope));
        }

        @DisplayName("onMessage processes RelinquishPlayerAction")
        @Test
        void processesRelinquishPlayerAction() {
            // Arrange
            when(tokenInfo.getGameId()).thenReturn(GAME_ID);
            when(tokenInfo.getPlayerId()).thenReturn(PLAYER_ID);

            mockActiveWebsocketConnection(PLAYER_ID);
            mockConnectedGameClient();

            PlayerClientActionEnvelope envelope = new PlayerClientActionEnvelope(new RelinquishPlayerAction());

            // Act
            sessionManager.onMessage(tokenInfo, envelope);

            // Assert
            verify(sessionRegistry).removeSession(PLAYER_ID);
        }

        @DisplayName("onMessage processes DrawCardAction if it's the current player's turn")
        @Test
        void processesDrawCardActionSuccessful() {
            // Arrange
            when(tokenInfo.getGameId()).thenReturn(GAME_ID);
            when(tokenInfo.getPlayerId()).thenReturn(PLAYER_ID);

            Player currentPlayer = mock(Player.class);
            when(currentPlayer.id()).thenReturn(PLAYER_ID);
            when(gameService.getCurrentPlayer(GAME_ID)).thenReturn(currentPlayer);

            PlayerClientActionEnvelope envelope = new PlayerClientActionEnvelope(new DrawCardAction(1000L));

            // Act
            sessionManager.onMessage(tokenInfo, envelope);

            // Assert
            verify(gameService).drawCard(1000L, GAME_ID);
        }

        @DisplayName("onMessage throws GameException on DrawCardAction if it is not the player's turn")
        @Test
        void processesDrawCardActionIncorrectTurn() {
            // Arrange
            when(tokenInfo.getGameId()).thenReturn(GAME_ID);
            when(tokenInfo.getPlayerId()).thenReturn(PLAYER_ID);

            Player currentPlayer = mock(Player.class);
            when(currentPlayer.id()).thenReturn("different-player");
            when(gameService.getCurrentPlayer(GAME_ID)).thenReturn(currentPlayer);

            PlayerClientActionEnvelope envelope = new PlayerClientActionEnvelope(new DrawCardAction(1000L));

            // Act & Assert
            assertThrows(GameException.class, () -> sessionManager.onMessage(tokenInfo, envelope));
        }
    }

    @Nested
    @DisplayName("Observer & Broadcast Events Tests")
    class ObserverBroadcasts {

        //        private void setupActiveGameWithPlayers() {
        //            Game game = mock(Game.class);
        //            Player p1 = mock(Player.class);
        //            when(p1.id()).thenReturn("p1");
        //            Player p2 = mock(Player.class);
        //            when(p2.id()).thenReturn("p2");
        //
        //            when(game.getPlayers()).thenReturn(List.of(p1, p2));
        //            when(gameService.getGame(GAME_ID)).thenReturn(game);
        //
        //            // Setup active connections for both players
        //            Session s1 = mock(Session.class);
        //            when(s1.getConnectionId()).thenReturn(Optional.of("conn-p1"));
        //            when(s1.getSessionId()).thenReturn("p1");
        //            when(sessionRegistry.getSession("p1")).thenReturn(Optional.of(s1));
        //
        //            Session s2 = mock(Session.class);
        //            when(s2.getConnectionId()).thenReturn(Optional.of("conn-p2"));
        //            when(s2.getSessionId()).thenReturn("p2");
        //            when(sessionRegistry.getSession("p2")).thenReturn(Optional.of(s2));
        //
        //            WebSocketConnection c1 = mock(WebSocketConnection.class);
        //            WebSocketConnection c2 = mock(WebSocketConnection.class);
        //            when(connections.findByConnectionId("conn-p1")).thenReturn(Optional.of(c1));
        //            when(connections.findByConnectionId("conn-p2")).thenReturn(Optional.of(c2));
        //        }
    }
}
