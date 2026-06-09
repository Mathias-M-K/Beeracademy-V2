package dk.mathiaskofod.services.session.repository;

import java.util.Optional;
import lombok.Getter;
import lombok.NoArgsConstructor;

@NoArgsConstructor
public class Session {

    @Getter
    private String sessionId;

    private String connectionId; // The ID provided by Quarkus Websocket

    /**
     * Creates a session
     *
     * @param sessionId game-id or player-id
     */
    public Session(String sessionId) {
        this.sessionId = sessionId;
    }

    public Session(String sessionId, String connectionId) {
        this.sessionId = sessionId;
        this.connectionId = connectionId;
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
