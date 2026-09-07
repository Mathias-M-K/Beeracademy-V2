package dk.mathiaskofod.services.session;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import dk.mathiaskofod.common.dto.game.GameDto;
import dk.mathiaskofod.domain.game.Game;
import dk.mathiaskofod.domain.game.deck.models.Card;
import dk.mathiaskofod.domain.game.deck.models.Suit;
import dk.mathiaskofod.domain.game.events.ChugEvent;
import dk.mathiaskofod.domain.game.events.DrawCardEvent;
import dk.mathiaskofod.domain.game.events.GameEvent;
import dk.mathiaskofod.domain.game.events.EndGameEvent;
import dk.mathiaskofod.domain.game.events.PauseGameEvent;
import dk.mathiaskofod.domain.game.events.ResumeGameEvent;
import dk.mathiaskofod.domain.game.events.StartGameEvent;
import dk.mathiaskofod.domain.game.models.Chug;
import dk.mathiaskofod.domain.game.models.Turn;
import dk.mathiaskofod.domain.game.player.Player;
import dk.mathiaskofod.domain.game.player.models.Stats;
import dk.mathiaskofod.domain.game.reports.GameReport;
import dk.mathiaskofod.domain.game.timer.TimerReports;
import dk.mathiaskofod.services.auth.models.TokenInfo;
import dk.mathiaskofod.services.game.GameService;
import dk.mathiaskofod.services.game.GameSessionService;
import dk.mathiaskofod.services.event.publisher.SseEventPublisher;
import dk.mathiaskofod.services.event.publisher.models.ConnectionEvent;
import dk.mathiaskofod.services.game.exceptions.GameNotFoundException;
import dk.mathiaskofod.services.lobby.LobbyService;
import dk.mathiaskofod.services.party.PartyService;
import dk.mathiaskofod.services.session.actions.game.client.GameClientAction;
import dk.mathiaskofod.services.session.actions.game.client.EndGameAction;
import dk.mathiaskofod.services.session.actions.game.client.KickPlayerAction;
import dk.mathiaskofod.services.session.actions.game.client.PauseGameAction;
import dk.mathiaskofod.services.session.actions.game.client.RegisterChugAction;
import dk.mathiaskofod.services.session.actions.game.client.ReleasePlayerAction;
import dk.mathiaskofod.services.session.actions.game.client.ResumeGameAction;
import dk.mathiaskofod.services.session.actions.game.client.StartGameAction;
import dk.mathiaskofod.services.session.actions.game.common.DrawCardAction;
import dk.mathiaskofod.services.session.envelopes.GameClientActionEnvelope;
import dk.mathiaskofod.services.session.envelopes.GameClientEventEnvelope;
import dk.mathiaskofod.services.session.envelopes.GameEventEnvelope;
import dk.mathiaskofod.services.session.envelopes.WebsocketEnvelope;
import dk.mathiaskofod.services.session.events.common.Handshake;
import dk.mathiaskofod.services.session.events.game.gameclient.GameClientConnectedEvent;
import dk.mathiaskofod.services.session.events.game.gameclient.GameClientEvent;
import dk.mathiaskofod.services.session.events.game.gameclient.PlayerKickedEvent;
import dk.mathiaskofod.services.session.events.game.gameclient.PlayerReleaseRequestedEvent;
import dk.mathiaskofod.services.session.events.game.gameclient.PlayerReleasedEvent;
import dk.mathiaskofod.services.session.exceptions.NoPartyLeaderConnectedException;
import dk.mathiaskofod.services.session.exceptions.PartyMemberNotFoundException;
import dk.mathiaskofod.services.session.exceptions.SessionConnectedException;
import dk.mathiaskofod.services.session.exceptions.SessionNotFoundException;
import dk.mathiaskofod.services.session.exceptions.UnknownActionException;
import dk.mathiaskofod.services.session.exceptions.UnknownCategoryException;
import dk.mathiaskofod.services.session.exceptions.UnknownEventException;
import dk.mathiaskofod.services.session.repository.Session;
import dk.mathiaskofod.services.session.repository.SessionRegistry;
import dk.mathiaskofod.websocket.game.models.WebsocketCodes;
import io.quarkus.websockets.next.CloseReason;
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
    PartyService partyService;

    @Mock
    SseEventPublisher sseEventPublisher;

    @Mock
    OpenConnections connections;

    @Mock
    TokenInfo tokenInfo;

    GameClientSessionManager sessionManager;

    private static final String PARTY_ID = "game-123";
    private static final String PARTICIPANT_ID = "participant-789";
    private static final String CONN_ID = "websocket-conn-456";
    private static final String PLAYER_ID = "player-p1";
    private static final String PLAYER_CONN_ID = "websocket-conn-player";

    @BeforeEach
    void setUp() {
        sessionManager = new GameClientSessionManager();
        sessionManager.sessionRegistry = sessionRegistry;
        sessionManager.gameService = gameService;
        sessionManager.lobbyService = lobbyService;
        sessionManager.gameSessionService = gameSessionService;
        sessionManager.partyService = partyService;
        sessionManager.sseEventPublisher = sseEventPublisher;
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
        when(gameService.getGame(PARTY_ID)).thenReturn(game);
    }

    /**
     * Sets up a connected party leader (game client) as the sole party member, so broadcastToParty delivers to it.
     *
     * @return the party leader's websocket connection, for verifying what was broadcast
     */
    private WebSocketConnection mockConnectedPartyLeader() {
        Session partyLeaderSession = mock(Session.class);
        when(sessionRegistry.getSession(PARTY_ID)).thenReturn(Optional.of(partyLeaderSession));
        when(partyLeaderSession.isConnected()).thenReturn(true);
        when(partyLeaderSession.getSessionId()).thenReturn(PARTY_ID);
        when(partyLeaderSession.getConnectionId()).thenReturn(Optional.of(CONN_ID));

        Game game = mock(Game.class);
        when(game.getPlayers()).thenReturn(Collections.emptyList());
        when(gameService.getGame(PARTY_ID)).thenReturn(game);

        WebSocketConnection partyLeaderConnection = mock(WebSocketConnection.class);
        when(connections.findByConnectionId(CONN_ID)).thenReturn(Optional.of(partyLeaderConnection));
        return partyLeaderConnection;
    }

    /**
     * Registers a player session holding no websocket connection — the state a release requires.
     */
    private void mockDisconnectedPlayerSession() {
        Session playerSession = mock(Session.class);
        when(sessionRegistry.getSession(PLAYER_ID)).thenReturn(Optional.of(playerSession));
        when(playerSession.isConnected()).thenReturn(false);
    }

    /**
     * Registers a player session with a live websocket connection, which a kick has to close.
     *
     * @return the player's websocket connection, for verifying the close
     */
    private WebSocketConnection mockConnectedPlayer() {
        Session playerSession = mock(Session.class);
        when(sessionRegistry.getSession(PLAYER_ID)).thenReturn(Optional.of(playerSession));
        when(playerSession.getConnectionId()).thenReturn(Optional.of(PLAYER_CONN_ID));

        WebSocketConnection playerConnection = mock(WebSocketConnection.class);
        when(connections.findByConnectionId(PLAYER_CONN_ID)).thenReturn(Optional.of(playerConnection));
        return playerConnection;
    }

    @Nested
    @DisplayName("Connection Lifecycle Tests")
    class ConnectionLifecycle {

        @DisplayName("onNewConnection should stage connection and broadcast game info")
        @Test
        void newConnectionSuccessfully() {
            // Arrange
            when(tokenInfo.getPartyId()).thenReturn(PARTY_ID);
            when(tokenInfo.getClientId()).thenReturn(PARTY_ID);
            when(gameService.gameExists(PARTY_ID)).thenReturn(true);

            GameDto gameDto = mock(GameDto.class);
            when(gameSessionService.getGameView(PARTY_ID)).thenReturn(gameDto);

            mockActiveWebsocketConnection(PARTY_ID);

            // Act
            sessionManager.onNewConnection(CONN_ID, tokenInfo);

            // Assert
            verify(sessionRegistry).setConnectionId(PARTY_ID, CONN_ID);
            // Called for the broadcast plus the game-snapshot and identity messages
            verify(connections, atLeastOnce()).findByConnectionId(CONN_ID);
        }

        @DisplayName("onNewConnection confirms the handshake with the connecting client but excludes it from the connected broadcast")
        @Test
        void newConnectionConfirmsHandshake() {
            // Arrange
            when(tokenInfo.getPartyId()).thenReturn(PARTY_ID);
            when(tokenInfo.getClientId()).thenReturn(PARTY_ID);
            when(gameService.gameExists(PARTY_ID)).thenReturn(true);
            GameDto gameDto = mock(GameDto.class);
            when(gameSessionService.getGameView(PARTY_ID)).thenReturn(gameDto);

            mockActiveWebsocketConnection(PARTY_ID);
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
            when(tokenInfo.getPartyId()).thenReturn(PARTY_ID);
            when(gameService.gameExists(PARTY_ID)).thenReturn(false);

            // Act & Assert
            assertThrows(GameNotFoundException.class, () -> sessionManager.onNewConnection(CONN_ID, tokenInfo));
        }

        @DisplayName("onConnectionClosed should clear connection info in registry")
        @Test
        void connectionClosedSuccessfully() {
            // Arrange
            when(tokenInfo.getPartyId()).thenReturn(PARTY_ID);

            // Act
            sessionManager.onConnectionClosed(tokenInfo, null);

            // Assert
            verify(sessionRegistry).clearConnectionId(PARTY_ID);
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
            when(tokenInfo.getPartyId()).thenReturn(PARTY_ID);
            GameClientActionEnvelope envelope = new GameClientActionEnvelope(new StartGameAction());

            // Act
            sessionManager.onMessage(tokenInfo, envelope);

            // Assert
            verify(gameService).startGame(PARTY_ID);
        }

        @DisplayName("onMessage should process EndGameAction")
        @Test
        void processesEndGameAction() {
            // Arrange
            when(tokenInfo.getPartyId()).thenReturn(PARTY_ID);
            GameClientActionEnvelope envelope = new GameClientActionEnvelope(new EndGameAction());

            // Act
            sessionManager.onMessage(tokenInfo, envelope);

            // Assert
            verify(gameService).endGame(PARTY_ID);
        }

        @DisplayName("onMessage should process PauseGameAction")
        @Test
        void processesPauseGameAction() {
            // Arrange
            when(tokenInfo.getPartyId()).thenReturn(PARTY_ID);
            GameClientActionEnvelope envelope = new GameClientActionEnvelope(new PauseGameAction());

            // Act
            sessionManager.onMessage(tokenInfo, envelope);

            // Assert
            verify(gameService).pauseGame(PARTY_ID);
        }

        @DisplayName("onMessage should process ResumeGameAction")
        @Test
        void processesResumeGameAction() {
            // Arrange
            when(tokenInfo.getPartyId()).thenReturn(PARTY_ID);
            GameClientActionEnvelope envelope = new GameClientActionEnvelope(new ResumeGameAction());

            // Act
            sessionManager.onMessage(tokenInfo, envelope);

            // Assert
            verify(gameService).resumeGame(PARTY_ID);
        }

        @DisplayName("onMessage should process DrawCardAction")
        @Test
        void processesDrawCardAction() {
            // Arrange
            when(tokenInfo.getPartyId()).thenReturn(PARTY_ID);
            GameClientActionEnvelope envelope = new GameClientActionEnvelope(new DrawCardAction(1200L));

            // Act
            sessionManager.onMessage(tokenInfo, envelope);

            // Assert
            verify(gameService).drawCard(1200L, PARTY_ID);
        }

        @DisplayName("onMessage should process RegisterChugAction")
        @Test
        void processesRegisterChugAction() {
            // Arrange
            when(tokenInfo.getPartyId()).thenReturn(PARTY_ID);
            Chug chug = new Chug(Suit.SPADE, 3200L);
            GameClientActionEnvelope envelope = new GameClientActionEnvelope(new RegisterChugAction(chug));

            // Act
            sessionManager.onMessage(tokenInfo, envelope);

            // Assert
            verify(gameService).registerChug(chug, PARTY_ID);
        }

        @DisplayName("onMessage throws UnknownActionException for a game client action it does not handle")
        @Test
        void unknownGameClientAction() {
            // Arrange
            when(tokenInfo.getPartyId()).thenReturn(PARTY_ID);
            GameClientActionEnvelope envelope = new GameClientActionEnvelope(mock(GameClientAction.class));

            // Act & Assert
            assertThrows(UnknownActionException.class, () -> sessionManager.onMessage(tokenInfo, envelope));
        }
    }

    @Nested
    @DisplayName("Player Release Request Tests")
    class PlayerReleaseRequests {

        @DisplayName("requestPlayerRelease rejects a participant that belongs to another party")
        @Test
        void rejectsParticipantFromAnotherParty() {
            // Arrange
            when(partyService.isParticipantMemberOfParty(PARTY_ID, PARTICIPANT_ID)).thenReturn(false);

            // Act & Assert
            assertThrows(
                    PartyMemberNotFoundException.class,
                    () -> sessionManager.requestParticipantRelease(PARTY_ID, PARTICIPANT_ID));
            verifyNoInteractions(connections);
        }

        @DisplayName("requestPlayerRelease rejects a participant that still holds an active connection")
        @Test
        void rejectsConnectedParticipant() {
            // Arrange
            when(partyService.isParticipantMemberOfParty(PARTY_ID, PARTICIPANT_ID)).thenReturn(true);

            Session partyLeaderSession = mock(Session.class);
            when(partyLeaderSession.isConnected()).thenReturn(true);
            when(sessionRegistry.getSession(PARTY_ID)).thenReturn(Optional.of(partyLeaderSession));

            Session participantSession = mock(Session.class);
            when(participantSession.isConnected()).thenReturn(true);
            when(sessionRegistry.getSession(PARTICIPANT_ID)).thenReturn(Optional.of(participantSession));

            // Act & Assert
            assertThrows(
                    SessionConnectedException.class,
                    () -> sessionManager.requestParticipantRelease(PARTY_ID, PARTICIPANT_ID));
            verifyNoInteractions(connections);
        }

        @DisplayName("requestPlayerRelease forwards the request to the party leader only")
        @Test
        void forwardsRequestToPartyLeader() {
            // Arrange
            when(partyService.isParticipantMemberOfParty(PARTY_ID, PARTICIPANT_ID)).thenReturn(true);

            Session partyLeaderSession = mock(Session.class);
            when(partyLeaderSession.isConnected()).thenReturn(true);
            when(partyLeaderSession.getConnectionId()).thenReturn(Optional.of(CONN_ID));
            when(sessionRegistry.getSession(PARTY_ID)).thenReturn(Optional.of(partyLeaderSession));

            Session participantSession = mock(Session.class);
            when(participantSession.isConnected()).thenReturn(false);
            when(sessionRegistry.getSession(PARTICIPANT_ID)).thenReturn(Optional.of(participantSession));

            WebSocketConnection partyLeaderConnection = mock(WebSocketConnection.class);
            when(connections.findByConnectionId(CONN_ID)).thenReturn(Optional.of(partyLeaderConnection));

            // Act
            sessionManager.requestParticipantRelease(PARTY_ID, PARTICIPANT_ID);

            // Assert
            ArgumentCaptor<GameClientEventEnvelope> captor = ArgumentCaptor.forClass(GameClientEventEnvelope.class);
            verify(partyLeaderConnection).sendTextAndAwait(captor.capture());

            PlayerReleaseRequestedEvent event =
                    assertInstanceOf(PlayerReleaseRequestedEvent.class, captor.getValue().payload());
            assertEquals(PARTICIPANT_ID, event.playerId());
        }

        @DisplayName("requestPlayerRelease fails when the party has no registered leader session")
        @Test
        void rejectsWhenPartyLeaderSessionIsMissing() {
            // Arrange
            when(partyService.isParticipantMemberOfParty(PARTY_ID, PARTICIPANT_ID)).thenReturn(true);
            when(sessionRegistry.getSession(PARTY_ID)).thenReturn(Optional.empty());

            // Act & Assert
            assertThrows(
                    SessionNotFoundException.class,
                    () -> sessionManager.requestParticipantRelease(PARTY_ID, PARTICIPANT_ID));
            verifyNoInteractions(connections);
        }

        @DisplayName("requestPlayerRelease fails when no party leader is connected to approve it")
        @Test
        void rejectsWhenNoPartyLeaderIsConnected() {
            // Arrange
            when(partyService.isParticipantMemberOfParty(PARTY_ID, PARTICIPANT_ID)).thenReturn(true);

            Session partyLeaderSession = mock(Session.class);
            when(partyLeaderSession.isConnected()).thenReturn(false);
            when(sessionRegistry.getSession(PARTY_ID)).thenReturn(Optional.of(partyLeaderSession));

            // Act & Assert
            assertThrows(
                    NoPartyLeaderConnectedException.class,
                    () -> sessionManager.requestParticipantRelease(PARTY_ID, PARTICIPANT_ID));
            verifyNoInteractions(connections);
        }

        @DisplayName("requestPlayerRelease fails when the participant has no registered session")
        @Test
        void rejectsWhenParticipantSessionIsMissing() {
            // Arrange
            when(partyService.isParticipantMemberOfParty(PARTY_ID, PARTICIPANT_ID)).thenReturn(true);

            Session partyLeaderSession = mock(Session.class);
            when(partyLeaderSession.isConnected()).thenReturn(true);
            when(sessionRegistry.getSession(PARTY_ID)).thenReturn(Optional.of(partyLeaderSession));
            when(sessionRegistry.getSession(PARTICIPANT_ID)).thenReturn(Optional.empty());

            // Act & Assert
            assertThrows(
                    SessionNotFoundException.class,
                    () -> sessionManager.requestParticipantRelease(PARTY_ID, PARTICIPANT_ID));
            verifyNoInteractions(connections);
        }
    }

    @Nested
    @DisplayName("Release and Kick Player Tests")
    class ReleaseAndKickPlayer {

        @DisplayName("onMessage releases a disconnected player, publishes the release and broadcasts the event")
        @Test
        void processesReleasePlayerAction() {
            // Arrange
            when(tokenInfo.getPartyId()).thenReturn(PARTY_ID);
            mockDisconnectedPlayerSession();
            WebSocketConnection partyLeaderConnection = mockConnectedPartyLeader();

            GameClientActionEnvelope envelope = new GameClientActionEnvelope(new ReleasePlayerAction(PLAYER_ID));

            // Act
            sessionManager.onMessage(tokenInfo, envelope);

            // Assert
            verify(sessionRegistry).removeSession(PLAYER_ID);
            verify(sseEventPublisher).publishNewConnectionEvent(PARTY_ID, PLAYER_ID, ConnectionEvent.RELEASED);

            ArgumentCaptor<GameClientEventEnvelope> captor = ArgumentCaptor.forClass(GameClientEventEnvelope.class);
            verify(partyLeaderConnection).sendTextAndAwait(captor.capture());
            PlayerReleasedEvent event =
                    assertInstanceOf(PlayerReleasedEvent.class, captor.getValue().payload());
            assertEquals(PLAYER_ID, event.playerId());
        }

        @DisplayName("onMessage refuses to release a player that still holds an active connection")
        @Test
        void rejectsReleasingConnectedPlayer() {
            // Arrange
            when(tokenInfo.getPartyId()).thenReturn(PARTY_ID);

            Session playerSession = mock(Session.class);
            when(playerSession.isConnected()).thenReturn(true);
            when(sessionRegistry.getSession(PLAYER_ID)).thenReturn(Optional.of(playerSession));

            GameClientActionEnvelope envelope = new GameClientActionEnvelope(new ReleasePlayerAction(PLAYER_ID));

            // Act & Assert
            assertThrows(SessionConnectedException.class, () -> sessionManager.onMessage(tokenInfo, envelope));
            verify(sessionRegistry, never()).removeSession(PLAYER_ID);
            verifyNoInteractions(sseEventPublisher);
        }

        @DisplayName("onMessage refuses to release a player without a registered session")
        @Test
        void rejectsReleasingUnknownPlayer() {
            // Arrange
            when(tokenInfo.getPartyId()).thenReturn(PARTY_ID);
            when(sessionRegistry.getSession(PLAYER_ID)).thenReturn(Optional.empty());

            GameClientActionEnvelope envelope = new GameClientActionEnvelope(new ReleasePlayerAction(PLAYER_ID));

            // Act & Assert
            assertThrows(SessionNotFoundException.class, () -> sessionManager.onMessage(tokenInfo, envelope));
            verifyNoInteractions(sseEventPublisher);
        }

        @DisplayName("onMessage kicks a player: closes the connection with the kick code and broadcasts the reason")
        @Test
        void processesKickPlayerAction() {
            // Arrange
            String reason = "Went to get more beer";
            when(tokenInfo.getPartyId()).thenReturn(PARTY_ID);

            WebSocketConnection playerConnection = mockConnectedPlayer();
            WebSocketConnection partyLeaderConnection = mockConnectedPartyLeader();

            GameClientActionEnvelope envelope = new GameClientActionEnvelope(new KickPlayerAction(PLAYER_ID, reason));

            // Act
            sessionManager.onMessage(tokenInfo, envelope);

            // Assert
            ArgumentCaptor<CloseReason> closeReasonCaptor = ArgumentCaptor.forClass(CloseReason.class);
            verify(playerConnection).closeAndAwait(closeReasonCaptor.capture());
            assertEquals(WebsocketCodes.KICKED.getCode(), closeReasonCaptor.getValue().getCode());
            assertEquals(reason, closeReasonCaptor.getValue().getMessage());

            verify(sessionRegistry).removeSession(PLAYER_ID);
            verify(sseEventPublisher).publishNewConnectionEvent(PARTY_ID, PLAYER_ID, ConnectionEvent.RELEASED);

            ArgumentCaptor<GameClientEventEnvelope> captor = ArgumentCaptor.forClass(GameClientEventEnvelope.class);
            verify(partyLeaderConnection).sendTextAndAwait(captor.capture());
            PlayerKickedEvent event = assertInstanceOf(PlayerKickedEvent.class, captor.getValue().payload());
            assertEquals(PLAYER_ID, event.playerId());
            assertEquals(reason, event.reason());
        }

        @DisplayName("onMessage refuses to kick a player without a registered session")
        @Test
        void rejectsKickingUnknownPlayer() {
            // Arrange
            when(tokenInfo.getPartyId()).thenReturn(PARTY_ID);
            when(sessionRegistry.getSession(PLAYER_ID)).thenReturn(Optional.empty());

            GameClientActionEnvelope envelope =
                    new GameClientActionEnvelope(new KickPlayerAction(PLAYER_ID, "Left without saying goodbye"));

            // Act & Assert
            assertThrows(SessionNotFoundException.class, () -> sessionManager.onMessage(tokenInfo, envelope));
            verifyNoInteractions(sseEventPublisher);
        }
    }

    @Nested
    @DisplayName("Party Broadcast Tests")
    class PartyBroadcast {

        private static final String CONNECTED_PLAYER_ID = "p1";
        private static final String OFFLINE_PLAYER_ID = "p2";
        private static final String UNREGISTERED_PLAYER_ID = "p3";
        private static final String CONNECTED_PLAYER_CONN_ID = "websocket-conn-p1";

        private static Player player(String id) {
            return new Player("Player " + id, id, 14, true, new Stats());
        }

        @DisplayName("A broadcast reaches every connected player as well as the game client")
        @Test
        void broadcastReachesConnectedPlayersAndGameClient() {
            // Arrange
            StartGameEvent event = mock(StartGameEvent.class);
            when(event.gameId()).thenReturn(PARTY_ID);

            Session partyLeaderSession = mock(Session.class);
            when(sessionRegistry.getSession(PARTY_ID)).thenReturn(Optional.of(partyLeaderSession));
            when(partyLeaderSession.isConnected()).thenReturn(true);
            when(partyLeaderSession.getSessionId()).thenReturn(PARTY_ID);
            when(partyLeaderSession.getConnectionId()).thenReturn(Optional.of(CONN_ID));

            WebSocketConnection partyLeaderConnection = mock(WebSocketConnection.class);
            when(connections.findByConnectionId(CONN_ID)).thenReturn(Optional.of(partyLeaderConnection));

            Game game = mock(Game.class);
            when(game.getPlayers())
                    .thenReturn(List.of(
                            player(CONNECTED_PLAYER_ID), player(OFFLINE_PLAYER_ID), player(UNREGISTERED_PLAYER_ID)));
            when(gameService.getGame(PARTY_ID)).thenReturn(game);

            // A player who is connected, one who holds a session but no live connection, and one with no session at all
            Session connectedPlayerSession = mock(Session.class);
            when(connectedPlayerSession.getConnectionId()).thenReturn(Optional.of(CONNECTED_PLAYER_CONN_ID));
            when(connectedPlayerSession.getSessionId()).thenReturn(CONNECTED_PLAYER_ID);
            when(sessionRegistry.getSession(CONNECTED_PLAYER_ID)).thenReturn(Optional.of(connectedPlayerSession));

            Session offlinePlayerSession = mock(Session.class);
            when(offlinePlayerSession.getConnectionId()).thenReturn(Optional.empty());
            when(sessionRegistry.getSession(OFFLINE_PLAYER_ID)).thenReturn(Optional.of(offlinePlayerSession));

            when(sessionRegistry.getSession(UNREGISTERED_PLAYER_ID)).thenReturn(Optional.empty());

            WebSocketConnection connectedPlayerConnection = mock(WebSocketConnection.class);
            when(connections.findByConnectionId(CONNECTED_PLAYER_CONN_ID))
                    .thenReturn(Optional.of(connectedPlayerConnection));

            // Act
            sessionManager.onGameEvent(event);

            // Assert
            verify(connectedPlayerConnection).sendTextAndAwait(any(GameEventEnvelope.class));
            verify(partyLeaderConnection).sendTextAndAwait(any(GameEventEnvelope.class));
        }

        @DisplayName("An excluded player is skipped, and so is the game client when it is excluded")
        @Test
        void excludedRecipientsAreSkipped() {
            // Arrange
            when(tokenInfo.getPartyId()).thenReturn(PARTY_ID);
            when(tokenInfo.getClientId()).thenReturn(PARTY_ID);
            when(gameService.gameExists(PARTY_ID)).thenReturn(true);

            GameDto gameDto = mock(GameDto.class);
            when(gameSessionService.getGameView(PARTY_ID)).thenReturn(gameDto);

            // onNewConnection excludes the connecting game client from its own connected-event broadcast
            Session gameClientSession = mock(Session.class);
            when(sessionRegistry.getSession(PARTY_ID)).thenReturn(Optional.of(gameClientSession));
            when(gameClientSession.getConnectionId()).thenReturn(Optional.of(CONN_ID));

            WebSocketConnection gameClientConnection = mock(WebSocketConnection.class);
            when(connections.findByConnectionId(CONN_ID)).thenReturn(Optional.of(gameClientConnection));

            Game game = mock(Game.class);
            when(game.getPlayers()).thenReturn(List.of(player(CONNECTED_PLAYER_ID)));
            when(gameService.getGame(PARTY_ID)).thenReturn(game);

            Session connectedPlayerSession = mock(Session.class);
            when(connectedPlayerSession.getConnectionId()).thenReturn(Optional.of(CONNECTED_PLAYER_CONN_ID));
            when(connectedPlayerSession.getSessionId()).thenReturn(CONNECTED_PLAYER_ID);
            when(sessionRegistry.getSession(CONNECTED_PLAYER_ID)).thenReturn(Optional.of(connectedPlayerSession));

            WebSocketConnection connectedPlayerConnection = mock(WebSocketConnection.class);
            when(connections.findByConnectionId(CONNECTED_PLAYER_CONN_ID))
                    .thenReturn(Optional.of(connectedPlayerConnection));

            // Act
            sessionManager.onNewConnection(CONN_ID, tokenInfo);

            // Assert
            ArgumentCaptor<GameClientEventEnvelope> playerCaptor =
                    ArgumentCaptor.forClass(GameClientEventEnvelope.class);
            verify(connectedPlayerConnection).sendTextAndAwait(playerCaptor.capture());
            assertInstanceOf(GameClientConnectedEvent.class, playerCaptor.getValue().payload());

            ArgumentCaptor<GameClientEventEnvelope> gameClientCaptor =
                    ArgumentCaptor.forClass(GameClientEventEnvelope.class);
            verify(gameClientConnection, atLeastOnce()).sendTextAndAwait(gameClientCaptor.capture());
            assertFalse(
                    gameClientCaptor.getAllValues().stream()
                            .map(GameClientEventEnvelope::payload)
                            .anyMatch(GameClientConnectedEvent.class::isInstance),
                    "The excluded game client should not receive its own connected event");
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
            when(event.gameId()).thenReturn(PARTY_ID);

            mockActiveWebsocketConnection(PARTY_ID);

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
            when(event.gameId()).thenReturn(PARTY_ID);
            when(event.gameReport()).thenReturn(gameReport);
            when(event.playerReports()).thenReturn(Collections.emptyList());
            when(event.timerReports()).thenReturn(timerReports);

            mockActiveWebsocketConnection(PARTY_ID);

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
            when(event.gameId()).thenReturn(PARTY_ID);
            when(event.turn()).thenReturn(turn);
            when(event.drawnBy()).thenReturn(drawnBy);
            when(event.nextToDraw()).thenReturn(nextToDraw);
            when(event.nextAfter()).thenReturn(nextAfter);

            mockActiveWebsocketConnection(PARTY_ID);

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
            when(event.gameId()).thenReturn(PARTY_ID);
            when(event.chug()).thenReturn(new Chug(Suit.DIAMOND, 5000L));
            when(event.chuggedBy()).thenReturn(chuggedBy);
            when(event.nextToDraw()).thenReturn(nextToDraw);

            mockActiveWebsocketConnection(PARTY_ID);

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
            when(event.gameId()).thenReturn(PARTY_ID);
            when(event.timerReports()).thenReturn(timerReports);

            mockActiveWebsocketConnection(PARTY_ID);

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
            when(event.gameId()).thenReturn(PARTY_ID);
            when(event.timerReports()).thenReturn(timerReports);

            mockActiveWebsocketConnection(PARTY_ID);

            // Act
            sessionManager.onGameEvent(event);

            // Assert
            verify(connections).findByConnectionId(CONN_ID);
        }

        @DisplayName("onGameEvent throws UnknownEventException for a domain event it cannot map")
        @Test
        void unknownGameEventObserved() {
            // Arrange
            GameEvent event = mock(GameEvent.class);

            // Act & Assert
            assertThrows(UnknownEventException.class, () -> sessionManager.onGameEvent(event));
        }
    }
}
