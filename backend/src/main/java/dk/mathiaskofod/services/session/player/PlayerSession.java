package dk.mathiaskofod.services.session.player;

import dk.mathiaskofod.services.session.models.AbstractSession;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PlayerSession extends AbstractSession {

    private String playerId;

    public PlayerSession(String playerId) {
        this.playerId = playerId;
    }
}
