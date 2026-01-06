package dk.mathiaskofod.services.session.exceptions;

import dk.mathiaskofod.providers.exceptions.BaseException;

public class NoConnectionIdException extends BaseException {

    public NoConnectionIdException(String playerId) {
        super(String.format("No connection ID exist for game or player with id %s", playerId), 404);
    }
}
