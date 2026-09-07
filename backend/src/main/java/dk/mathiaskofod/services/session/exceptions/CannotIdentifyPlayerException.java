package dk.mathiaskofod.services.session.exceptions;

import dk.mathiaskofod.providers.exceptions.BaseException;

public class CannotIdentifyPlayerException extends BaseException {
    public CannotIdentifyPlayerException(String message, int statusCode) {
        super(message, statusCode);
    }
}
