package dk.mathiaskofod.services.game.exceptions;

import dk.mathiaskofod.providers.exeptions.BaseException;
import dk.mathiaskofod.services.game.game.id.generator.models.GameId;

public class GameNotStartedException extends BaseException {

    public GameNotStartedException(GameId gameId) {
        super("Game with id " + gameId + " haven't started yet", 409);
    }

}
