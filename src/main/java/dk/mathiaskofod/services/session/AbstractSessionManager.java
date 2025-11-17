package dk.mathiaskofod.services.session;

import dk.mathiaskofod.services.auth.AuthService;
import dk.mathiaskofod.services.game.GameService;
import dk.mathiaskofod.services.session.exceptions.WebsocketConnectionNotFoundException;
import dk.mathiaskofod.services.session.models.wrapper.WebsocketEnvelope;
import io.quarkus.websockets.next.OpenConnections;
import io.quarkus.websockets.next.WebSocketConnection;
import jakarta.inject.Inject;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

public abstract class AbstractSessionManager<TSession, Tid> {

    private final Map<Tid, TSession> sessions = new HashMap<>();

    @Inject
    protected GameService gameService;

    @Inject
    protected AuthService authService;

    @Inject
    private OpenConnections connections;

    public Optional<TSession> getSession(Tid id){
        return Optional.ofNullable(sessions.get(id));
    }

    protected void addSession(Tid id, TSession session){
        sessions.put(id, session);
    }

    protected void removeSession(Tid id){
        sessions.remove(id);
    }

    protected abstract String getConnectionId(Tid id);

    protected void closeConnection(Tid sessionId){
        getWebsocketConnection(sessionId).closeAndAwait();
    }

    private WebSocketConnection getWebsocketConnection(Tid id) {
        String connectionId = getConnectionId(id);
        return connections.findByConnectionId(connectionId)
                .orElseThrow(() -> new WebsocketConnectionNotFoundException("Websocket connection not found for id: " + connectionId));
    }

    protected void sendMessage(Tid sessionId, WebsocketEnvelope message){
        WebSocketConnection connection = getWebsocketConnection(sessionId);
        connection.sendTextAndAwait(message);
    }

}
