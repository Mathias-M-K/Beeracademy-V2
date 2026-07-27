package dk.mathiaskofod.services.session;

import dk.mathiaskofod.services.auth.models.TokenInfo;
import dk.mathiaskofod.services.game.GameService;
import dk.mathiaskofod.services.lobby.LobbyService;
import dk.mathiaskofod.services.session.envelopes.WebsocketEnvelope;
import dk.mathiaskofod.services.session.events.common.IdentityEvent;
import dk.mathiaskofod.services.session.exceptions.NoConnectionIdException;
import dk.mathiaskofod.services.session.exceptions.SessionNotFoundException;
import dk.mathiaskofod.services.session.exceptions.WebsocketConnectionNotFoundException;
import dk.mathiaskofod.services.session.repository.SessionRegistry;
import io.quarkus.websockets.next.OpenConnections;
import io.quarkus.websockets.next.WebSocketConnection;
import jakarta.inject.Inject;
import java.util.function.Function;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public abstract class AbstractSessionManager implements WebsocketSessionManager {

    @Inject
    SessionRegistry sessionRegistry;

    @Inject
    protected GameService gameService;

    @Inject
    protected LobbyService lobbyService;

    @Inject
    OpenConnections connections;

    protected final String getConnectionId(String sessionId) {
        return sessionRegistry
                .getSession(sessionId)
                .orElseThrow(() -> new SessionNotFoundException(sessionId))
                .getConnectionId()
                .orElseThrow(() -> new NoConnectionIdException(sessionId));
    }

    protected final void closeConnection(String sessionId) {
        getWebsocketConnection(sessionId).closeAndAwait();
    }

    /**
     * @param playerId/participantId id of either player or participant
     * @return active websocket connection
     */
    protected WebSocketConnection getWebsocketConnection(String playerId) {
        String connectionId = getConnectionId(playerId);
        return connections
                .findByConnectionId(connectionId)
                .orElseThrow(() -> new WebsocketConnectionNotFoundException(
                        "Websocket connection not found for connectionId: " + connectionId));
    }

    protected final void sendMessage(String sessionId, WebsocketEnvelope<?> message) {

        try {
            WebSocketConnection connection = getWebsocketConnection(sessionId);
            connection.sendTextAndAwait(message);
        } catch (WebsocketConnectionNotFoundException e) {
            log.warn("Could not find a websocket connection-id when attempting to send a message to → {}", sessionId);
        } catch (NoConnectionIdException e) {
            log.warn("Could not find a connection-id for sessionId: {}, when attempting to send a message", sessionId);
        }
    }

    protected void provideIdentityToClient(
            TokenInfo tokenInfo, Function<IdentityEvent, WebsocketEnvelope<?>> envelope) {
        IdentityEvent event = new IdentityEvent(tokenInfo.getRole(), tokenInfo.getClientId());
        sendMessage(tokenInfo.getClientId(), envelope.apply(event));
    }
}
