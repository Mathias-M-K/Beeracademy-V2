package dk.mathiaskofod.services.session.game;

import dk.mathiaskofod.domain.game.models.GameId;
import dk.mathiaskofod.services.session.models.AbstractSession;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class GameSession extends AbstractSession {

    private GameId gameId;

    public GameSession(GameId gameId) {
        this.gameId = gameId;
    }

}
