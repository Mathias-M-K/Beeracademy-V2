package dk.mathiaskofod.services.session.repository;

import java.util.Optional;
import lombok.Getter;

public class Session {

    @Getter
    private final String sessionId;

    private String connectionId; // The ID provided by Quarkus Websocket

    /**
     * Creates a session
     *
     * @param sessionId game-id or player-id
     */
    public Session(String sessionId) {
        this.sessionId = sessionId;
    }

    public boolean isConnected() {
        return connectionId != null;
    }

    void setConnectionId(String connectionId) {
        this.connectionId = connectionId;
    }

    void clearConnectionId() {
        this.connectionId = null;
    }

    // Shared method for accessing the connection ID
    public Optional<String> getConnectionId() {
        return Optional.ofNullable(connectionId);
    }
}
