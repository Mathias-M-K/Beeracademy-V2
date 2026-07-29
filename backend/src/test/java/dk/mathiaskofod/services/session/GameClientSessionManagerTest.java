package dk.mathiaskofod.services.session;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import dk.mathiaskofod.common.dto.game.GameDto;
import dk.mathiaskofod.domain.game.Game;
import dk.mathiaskofod.domain.game.deck.models.Card;
import dk.mathiaskofod.domain.game.deck.models.Suit;
import dk.mathiaskofod.domain.game.events.ChugEvent;
import dk.mathiaskofod.domain.game.events.DrawCardEvent;
import dk.mathiaskofod.domain.game.events.EndGameEvent;
import dk.mathiaskofod.domain.game.events.PauseGameEvent;
import dk.mathiaskofod.domain.game.events.ResumeGameEvent;
import dk.mathiaskofod.domain.game.events.StartGameEvent;
import dk.mathiaskofod.domain.game.models.Chug;
import dk.mathiaskofod.domain.game.models.Turn;
import dk.mathiaskofod.domain.game.player.Player;
import dk.mathiaskofod.domain.game.reports.GameReport;
import dk.mathiaskofod.domain.game.timer.TimerReports;
import dk.mathiaskofod.services.auth.models.TokenInfo;
import dk.mathiaskofod.services.game.GameService;
import dk.mathiaskofod.services.game.GameSessionService;
import dk.mathiaskofod.services.game.exceptions.GameNotFoundException;
import dk.mathiaskofod.services.lobby.LobbyService;
import dk.mathiaskofod.services.session.actions.game.client.EndGameAction;
import dk.mathiaskofod.services.session.actions.game.client.PauseGameAction;
import dk.mathiaskofod.services.session.actions.game.client.RegisterChugAction;
import dk.mathiaskofod.services.session.actions.game.client.ResumeGameAction;
import dk.mathiaskofod.services.session.actions.game.client.StartGameAction;
import dk.mathiaskofod.services.session.actions.game.common.DrawCardAction;
import dk.mathiaskofod.services.session.envelopes.GameClientActionEnvelope;
import dk.mathiaskofod.services.session.envelopes.GameClientEventEnvelope;
import dk.mathiaskofod.services.session.envelopes.WebsocketEnvelope;
import dk.mathiaskofod.services.session.events.common.Handshake;
import dk.mathiaskofod.services.session.events.game.gameclient.GameClientConnectedEvent;
import dk.mathiaskofod.services.session.events.game.gameclient.GameClientEvent;
import dk.mathiaskofod.services.session.exceptions.UnknownCategoryException;
import dk.mathiaskofod.services.session.repository.Session;
import dk.mathiaskofod.services.session.repository.SessionRegistry;
import io.quarkus.websockets.next.OpenConnections;
import io.quarkus.websockets.next.WebSocketConnection;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class GameClientSessionManagerTest {

    @Mock
    SessionRegistry sessionRegistry;

    @Mock
    GameService gameService;

    @Mock
    LobbyService lobbyService;

    @Mock
    GameSessionService gameSessionService;

    @Mock
    OpenConnections connections;

    @Mock
    TokenInfo tokenInfo;

    GameClientSessionManager sessionManager;

    private static final String GAME_ID = "game-123";
    private static final String CONN_ID = "websocket-conn-456";

    @BeforeEach
    void setUp() {
        sessionManager = new GameClientSessionManager();
        sessionManager.sessionRegistry = sessionRegistry;
        sessionManager.gameService = gameService;
        sessionManager.lobbyService = lobbyService;
        sessionManager.gameSessionService = gameSessionService;
        sessionManager.connections = connections;
    }

    private void mockActiveWebsocketConnection(String sessionId) {
        Session session = mock(Session.class);
        when(sessionRegistry.getSession(sessionId)).thenReturn(Optional.of(session));
        when(session.getConnectionId()).thenReturn(Optional.of(CONN_ID));
        // Only exercised when the game client is included in a party broadcast; the game client
        // is excluded from its own connected-event broadcast, so keep these stubs lenient.
        lenient().when(session.isConnected()).thenReturn(true);
        lenient().when(session.getSessionId()).thenReturn(sessionId);

        WebSocketConnection connection = mock(WebSocketConnection.class);
        when(connections.findByConnectionId(CONN_ID)).thenReturn(Optional.of(connection));

        // broadcastToParty iterates the game's players; an empty roster keeps the party to the game client only
        Game game = mock(Game.class);
        when(game.getPlayers()).thenReturn(Collections.emptyList());
        when(gameService.getGame(GAME_ID)).thenReturn(game);
    }

    @Nested
    @DisplayName("Connection Lifecycle Tests")
    class ConnectionLifecycle {

        @DisplayName("onNewConnection should stage connection and broadcast game info")
        @Test
        void newConnectionSuccessfully() {
            // Arrange
            when(tokenInfo.getGameId()).thenReturn(GAME_ID);
            when(tokenInfo.getClientId()).thenReturn(GAME_ID);
            when(gameService.gameExists(GAME_ID)).thenReturn(true);

            GameDto gameDto = mock(GameDto.class);
            when(gameSessionService.getGameView(GAME_ID)).thenReturn(gameDto);

            mockActiveWebsocketConnection(GAME_ID);

            // Act
            sessionManager.onNewConnection(CONN_ID, tokenInfo);

            // Assert
            verify(sessionRegistry).setConnectionId(GAME_ID, CONN_ID);
            // Called for the broadcast plus the game-snapshot and identity messages
            verify(connections, atLeastOnce()).findByConnectionId(CONN_ID);
        }

        @DisplayName("onNewConnection confirms the handshake with the connecting client but excludes it from the connected broadcast")
        @Test
        void newConnectionConfirmsHandshake() {
            // Arrange
            when(tokenInfo.getGameId()).thenReturn(GAME_ID);
            when(tokenInfo.getClientId()).thenReturn(GAME_ID);
            when(gameService.gameExists(GAME_ID)).thenReturn(true);
            when(gameSessionService.getGameView(GAME_ID)).thenReturn(mock(GameDto.class));

            mockActiveWebsocketConnection(GAME_ID);
            WebSocketConnection clientConnection =
                    connections.findByConnectionId(CONN_ID).orElseThrow();

            // Act
            sessionManager.onNewConnection(CONN_ID, tokenInfo);

            // Assert
            ArgumentCaptor<GameClientEventEnvelope> captor = ArgumentCaptor.forClass(GameClientEventEnvelope.class);
            verify(clientConnection, atLeastOnce()).sendTextAndAwait(captor.capture());
            List<GameClientEvent> payloads = captor.getAllValues().stream()
                    .map(GameClientEventEnvelope::payload)
                    .toList();
            assertTrue(
                    payloads.stream().anyMatch(Handshake.class::isInstance),
                    "The connecting client should receive a handshake");
            assertFalse(
                    payloads.stream().anyMatch(GameClientConnectedEvent.class::isInstance),
                    "The connecting client should not receive its own connected event");
        }

        @DisplayName("onNewConnection throws GameNotFoundException if game does not exist")
        @Test
        void newConnectionGameNotFound() {
            // Arrange
            when(tokenInfo.getGameId()).thenReturn(GAME_ID);
            when(gameService.gameExists(GAME_ID)).thenReturn(false);

            // Act & Assert
            assertThrows(GameNotFoundException.class, () -> sessionManager.onNewConnection(CONN_ID, tokenInfo));
        }

        @DisplayName("onConnectionClosed should clear connection info in registry")
        @Test
        void connectionClosedSuccessfully() {
            // Arrange
            when(tokenInfo.getGameId()).thenReturn(GAME_ID);

            // Act
            sessionManager.onConnectionClosed(tokenInfo, null);

            // Assert
            verify(sessionRegistry).clearConnectionId(GAME_ID);
        }
    }

    @Nested
    @DisplayName("Action Envelope Handler Tests")
    class ActionHandling {

        @DisplayName("onMessage throws UnknownCategoryException if envelope is not for GameClientAction")
        @Test
        void invalidEnvelopeType() {
            // Arrange
            WebsocketEnvelope<?> invalidEnvelope = mock(WebsocketEnvelope.class);

            // Act & Assert
            assertThrows(UnknownCategoryException.class, () -> sessionManager.onMessage(tokenInfo, invalidEnvelope));
        }

        @DisplayName("onMessage should process StartGameAction")
        @Test
        void processesStartGameAction() {
            // Arrange
            when(tokenInfo.getGameId()).thenReturn(GAME_ID);
            GameClientActionEnvelope envelope = new GameClientActionEnvelope(new StartGameAction());

            // Act
            sessionManager.onMessage(tokenInfo, envelope);

            // Assert
            verify(gameService).startGame(GAME_ID);
        }

        @DisplayName("onMessage should process EndGameAction")
        @Test
        void processesEndGameAction() {
            // Arrange
            when(tokenInfo.getGameId()).thenReturn(GAME_ID);
            GameClientActionEnvelope envelope = new GameClientActionEnvelope(new EndGameAction());

            // Act
            sessionManager.onMessage(tokenInfo, envelope);

            // Assert
            verify(gameService).endGame(GAME_ID);
        }

        @DisplayName("onMessage should process PauseGameAction")
        @Test
        void processesPauseGameAction() {
            // Arrange
            when(tokenInfo.getGameId()).thenReturn(GAME_ID);
            GameClientActionEnvelope envelope = new GameClientActionEnvelope(new PauseGameAction());

            // Act
            sessionManager.onMessage(tokenInfo, envelope);

            // Assert
            verify(gameService).pauseGame(GAME_ID);
        }

        @DisplayName("onMessage should process ResumeGameAction")
        @Test
        void processesResumeGameAction() {
            // Arrange
            when(tokenInfo.getGameId()).thenReturn(GAME_ID);
            GameClientActionEnvelope envelope = new GameClientActionEnvelope(new ResumeGameAction());

            // Act
            sessionManager.onMessage(tokenInfo, envelope);

            // Assert
            verify(gameService).resumeGame(GAME_ID);
        }

        @DisplayName("onMessage should process DrawCardAction")
        @Test
        void processesDrawCardAction() {
            // Arrange
            when(tokenInfo.getGameId()).thenReturn(GAME_ID);
            GameClientActionEnvelope envelope = new GameClientActionEnvelope(new DrawCardAction(1200L));

            // Act
            sessionManager.onMessage(tokenInfo, envelope);

            // Assert
            verify(gameService).drawCard(1200L, GAME_ID);
        }

        @DisplayName("onMessage should process RegisterChugAction")
        @Test
        void processesRegisterChugAction() {
            // Arrange
            when(tokenInfo.getGameId()).thenReturn(GAME_ID);
            Chug chug = new Chug(Suit.SPADE, 3200L);
            GameClientActionEnvelope envelope = new GameClientActionEnvelope(new RegisterChugAction(chug));

            // Act
            sessionManager.onMessage(tokenInfo, envelope);

            // Assert
            verify(gameService).registerChug(chug, GAME_ID);
        }
    }

    @Nested
    @DisplayName("Observer Events Tests")
    class ObserverEvents {

        @DisplayName("onGameEvent should map StartGameEvent and broadcast envelope")
        @Test
        void startGameEventObserved() {
            // Arrange
            StartGameEvent event = mock(StartGameEvent.class);
            when(event.gameId()).thenReturn(GAME_ID);

            mockActiveWebsocketConnection(GAME_ID);

            // Act
            sessionManager.onGameEvent(event);

            // Assert
            verify(connections).findByConnectionId(CONN_ID);
        }

        @DisplayName("onGameEvent should map EndGameEvent and broadcast envelope")
        @Test
        void endGameEventObserved() {
            // Arrange
            // EndGameEvent.fromGameEvent accesses gameReport, playerReports, timerReports
            GameReport gameReport = mock(GameReport.class);
            TimerReports timerReports = mock(TimerReports.class);

            EndGameEvent event = mock(EndGameEvent.class);
            when(event.gameId()).thenReturn(GAME_ID);
            when(event.gameReport()).thenReturn(gameReport);
            when(event.playerReports()).thenReturn(Collections.emptyList());
            when(event.timerReports()).thenReturn(timerReports);

            mockActiveWebsocketConnection(GAME_ID);

            // Act
            sessionManager.onGameEvent(event);

            // Assert
            verify(connections).findByConnectionId(CONN_ID);
        }

        @DisplayName("onGameEvent should map DrawCardEvent and broadcast envelope")
        @Test
        void drawCardEventObserved() {
            // Arrange
            // DrawCardGameEventDto.fromGameEvent accesses turn, drawnBy, nextToDraw, nextAfter
            Player drawnBy = mock(Player.class);
            when(drawnBy.id()).thenReturn("p1");
            Player nextToDraw = mock(Player.class);
            when(nextToDraw.id()).thenReturn("p2");
            Player nextAfter = mock(Player.class);
            when(nextAfter.id()).thenReturn("p1");

            Turn turn = new Turn(1, new Card(Suit.HEART, 10), 1200L);

            DrawCardEvent event = mock(DrawCardEvent.class);
            when(event.gameId()).thenReturn(GAME_ID);
            when(event.turn()).thenReturn(turn);
            when(event.drawnBy()).thenReturn(drawnBy);
            when(event.nextToDraw()).thenReturn(nextToDraw);
            when(event.nextAfter()).thenReturn(nextAfter);

            mockActiveWebsocketConnection(GAME_ID);

            // Act
            sessionManager.onGameEvent(event);

            // Assert
            verify(connections).findByConnectionId(CONN_ID);
        }

        @DisplayName("onGameEvent should map ChugEvent and broadcast envelope")
        @Test
        void chugEventObserved() {
            // Arrange
            // ChugGameEventDto.fromGameEvent accesses chug, chuggedBy, nextToDraw
            Player chuggedBy = mock(Player.class);
            when(chuggedBy.id()).thenReturn("p1");
            Player nextToDraw = mock(Player.class);
            when(nextToDraw.id()).thenReturn("p2");

            ChugEvent event = mock(ChugEvent.class);
            when(event.gameId()).thenReturn(GAME_ID);
            when(event.chug()).thenReturn(new Chug(Suit.DIAMOND, 5000L));
            when(event.chuggedBy()).thenReturn(chuggedBy);
            when(event.nextToDraw()).thenReturn(nextToDraw);

            mockActiveWebsocketConnection(GAME_ID);

            // Act
            sessionManager.onGameEvent(event);

            // Assert
            verify(connections).findByConnectionId(CONN_ID);
        }

        @DisplayName("onGameEvent should map PauseGameEvent and broadcast envelope")
        @Test
        void pauseGameEventObserved() {
            // Arrange
            // PauseGameEvent.fromGameEvent accesses timerReports
            TimerReports timerReports = mock(TimerReports.class);

            PauseGameEvent event = mock(PauseGameEvent.class);
            when(event.gameId()).thenReturn(GAME_ID);
            when(event.timerReports()).thenReturn(timerReports);

            mockActiveWebsocketConnection(GAME_ID);

            // Act
            sessionManager.onGameEvent(event);

            // Assert
            verify(connections).findByConnectionId(CONN_ID);
        }

        @DisplayName("onGameEvent should map ResumeGameEvent and broadcast envelope")
        @Test
        void resumeGameEventObserved() {
            // Arrange
            // ResumeGameEvent.fromGameEvent accesses timerReports
            TimerReports timerReports = mock(TimerReports.class);

            ResumeGameEvent event = mock(ResumeGameEvent.class);
            when(event.gameId()).thenReturn(GAME_ID);
            when(event.timerReports()).thenReturn(timerReports);

            mockActiveWebsocketConnection(GAME_ID);

            // Act
            sessionManager.onGameEvent(event);

            // Assert
            verify(connections).findByConnectionId(CONN_ID);
        }
    }
}
