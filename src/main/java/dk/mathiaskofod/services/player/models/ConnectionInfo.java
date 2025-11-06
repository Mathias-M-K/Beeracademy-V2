package dk.mathiaskofod.services.player.models;

import lombok.Getter;
import lombok.Setter;

import java.util.Optional;

@Getter
@Setter
public class ConnectionInfo{

    private boolean isConnected = false;
    private boolean claimed = false;
    private String connectionId;
    private String token;

    public Optional<String> getConnectionId(){
        return Optional.ofNullable(connectionId);
    }

    public Optional<String> getToken(){
        return Optional.ofNullable(token);
    }
}
