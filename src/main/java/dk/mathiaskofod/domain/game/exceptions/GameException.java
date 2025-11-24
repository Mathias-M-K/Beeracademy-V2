package dk.mathiaskofod.domain.game.exceptions;

import dk.mathiaskofod.providers.exceptions.BaseException;

public class GameException extends BaseException {
    public GameException(String message, int httpStatus) {
        super(message, httpStatus);
    }
}
