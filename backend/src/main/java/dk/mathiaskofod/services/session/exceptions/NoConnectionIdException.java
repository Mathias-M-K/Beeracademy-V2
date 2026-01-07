package dk.mathiaskofod.services.session.exceptions;

import dk.mathiaskofod.providers.exceptions.BaseException;

public class NoConnectionIdException extends BaseException {

    public NoConnectionIdException(String resourceId) {
        super(String.format("Game or player with id:%s, is not connected", resourceId), 404);
    }
}
