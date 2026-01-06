package dk.mathiaskofod.services.session.game;

import dk.mathiaskofod.services.session.models.AbstractSession;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class GameSession extends AbstractSession {

    //TODO maybe we can refactor this
    private String gameId;

    public GameSession(String gameId) {
        this.gameId = gameId;
    }

}
