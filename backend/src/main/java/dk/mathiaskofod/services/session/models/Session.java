package dk.mathiaskofod.services.session.models;

import lombok.Getter;
import lombok.Setter;

import java.util.Optional;

@Setter
public class Session {

    @Getter
    private String sessionId;

    /**
     * Creates a session
     * @param sessionId game-id or player-id
     */
    public Session(String sessionId){
        this.sessionId = sessionId;
    }


    private String connectionId; // The ID provided by Quarkus

    public boolean isConnected() {
        return connectionId != null;
    }

    public void clearConnectionId() {
        this.connectionId = null;
    }

    // Shared method for accessing the connection ID
    public Optional<String> getConnectionId() {
        return Optional.ofNullable(connectionId);
    }

}
