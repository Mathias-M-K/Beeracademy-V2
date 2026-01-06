package dk.mathiaskofod.services.session.exceptions;

import dk.mathiaskofod.providers.exceptions.BaseException;

public class SessionNotFoundException extends BaseException {
    public SessionNotFoundException(String id) {
        super(String.format("Could not find a session matching ID: %s", id), 404);
    }
}
