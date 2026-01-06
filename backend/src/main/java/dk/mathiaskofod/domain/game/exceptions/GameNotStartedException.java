package dk.mathiaskofod.domain.game.exceptions;

import dk.mathiaskofod.providers.exceptions.BaseException;

public class GameNotStartedException extends BaseException {

    public GameNotStartedException(String gameId) {
        super("Game with gameId " + gameId + " haven't started yet", 409);
    }

}
