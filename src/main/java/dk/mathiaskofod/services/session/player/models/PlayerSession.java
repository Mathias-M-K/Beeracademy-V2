package dk.mathiaskofod.services.session.player.models;

import dk.mathiaskofod.services.session.models.AbstractSession;
import lombok.Getter;
import lombok.Setter;

import java.util.Optional;

@Getter
@Setter
public class PlayerSession extends AbstractSession {

    private String playerId;

    public PlayerSession(String playerId) {
        this.playerId = playerId;
    }

    public Optional<String> getPlayerId(){
        return Optional.ofNullable(playerId);
    }
}
