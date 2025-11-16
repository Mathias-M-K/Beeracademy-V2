package dk.mathiaskofod.services.session.game.models;

import dk.mathiaskofod.services.game.id.generator.models.GameId;
import dk.mathiaskofod.services.session.models.AbstractSession;
import lombok.Getter;
import lombok.Setter;

import java.util.Optional;

@Getter
@Setter
public class GameSession extends AbstractSession {

    private GameId gameId;

    public GameSession(GameId gameId) {
        this.gameId = gameId;
    }

    public Optional<GameId> getGameId(){
        return Optional.ofNullable(gameId);
    }



}
