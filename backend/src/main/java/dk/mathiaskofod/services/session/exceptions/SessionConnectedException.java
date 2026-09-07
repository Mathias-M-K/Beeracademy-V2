package dk.mathiaskofod.services.session.exceptions;

import dk.mathiaskofod.providers.exceptions.BaseException;

public class SessionConnectedException extends BaseException {
    public SessionConnectedException(String sessionId) {
        super(String.format("Session %s has an active connection", sessionId), 409);
    }
}
