package dk.mathiaskofod.services.session.models;

import lombok.Setter;

import java.util.Optional;

@Setter
public abstract class AbstractSession {

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
