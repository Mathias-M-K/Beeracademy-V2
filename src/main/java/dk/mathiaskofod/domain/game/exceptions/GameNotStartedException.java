package dk.mathiaskofod.domain.game.exceptions;

import dk.mathiaskofod.providers.exceptions.BaseException;
import dk.mathiaskofod.domain.game.models.GameId;

public class GameNotStartedException extends BaseException {

    public GameNotStartedException(GameId gameId) {
        super("Game with id " + gameId + " haven't started yet", 409);
    }

}
