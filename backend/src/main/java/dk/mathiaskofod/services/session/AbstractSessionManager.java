package dk.mathiaskofod.services.session;

import dk.mathiaskofod.services.game.GameService;
import dk.mathiaskofod.services.lobby.LobbyService;
import dk.mathiaskofod.services.session.exceptions.NoConnectionIdException;
import dk.mathiaskofod.services.session.exceptions.WebsocketConnectionNotFoundException;
import dk.mathiaskofod.services.session.envelopes.WebsocketEnvelope;
import dk.mathiaskofod.services.session.exceptions.SessionNotFoundException;
import dk.mathiaskofod.services.session.models.Session;
import dk.mathiaskofod.websocket.WebsocketSessionManager;
import io.quarkus.websockets.next.OpenConnections;
import io.quarkus.websockets.next.WebSocketConnection;
import jakarta.inject.Inject;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

public abstract class AbstractSessionManager implements WebsocketSessionManager {

    private final Map<String, Session> sessions = new HashMap<>();

    @Inject
    protected GameService gameService;

    @Inject
    protected LobbyService lobbyService;

    @Inject
    OpenConnections connections;

    public final Optional<Session> getSession(String id){
        return Optional.ofNullable(sessions.get(id));
    }

    protected final void addSession(String id, Session session){
        sessions.put(id, session);
    }

    protected final void removeSession(String id){
        sessions.remove(id);
    }

    protected final String getConnectionId(String sessionId){
        return getSession(sessionId).
                orElseThrow(() -> new SessionNotFoundException(sessionId))
                .getConnectionId()
                .orElseThrow(() -> new NoConnectionIdException(sessionId));
    }

    protected final void closeConnection(String sessionId){
        getWebsocketConnection(sessionId).closeAndAwait();
    }

    private WebSocketConnection getWebsocketConnection(String id) {
        String connectionId = getConnectionId(id);
        return connections.findByConnectionId(connectionId)
                .orElseThrow(() -> new WebsocketConnectionNotFoundException("Websocket connection not found for gameId: " + connectionId));
    }

    protected final void sendMessage(String sessionId, WebsocketEnvelope message){
        WebSocketConnection connection = getWebsocketConnection(sessionId);
        connection.sendTextAndAwait(message);
    }

}
