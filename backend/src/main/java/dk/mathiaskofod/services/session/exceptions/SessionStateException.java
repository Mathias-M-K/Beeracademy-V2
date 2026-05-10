package dk.mathiaskofod.services.session.exceptions;

import dk.mathiaskofod.providers.exceptions.BaseException;

public class SessionStateException extends BaseException {
    public SessionStateException(String message) {
        super(message, 409);
    }
}
