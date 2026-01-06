package dk.mathiaskofod.services.lobby.models;

import lombok.Setter;

import java.util.Optional;

@Setter
public class Session {

    private String connectionId; // The ID provided by Quarkus

    public boolean isConnected() {
        return connectionId != null;
    }

    public void clearConnectionId() {
        this.connectionId = null;
    }

    public Optional<String> getConnectionId() {
        return Optional.ofNullable(connectionId);
    }
}
