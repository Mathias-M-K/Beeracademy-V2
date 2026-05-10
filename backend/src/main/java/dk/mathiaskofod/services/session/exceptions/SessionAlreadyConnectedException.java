package dk.mathiaskofod.services.session.exceptions;

import dk.mathiaskofod.providers.exceptions.BaseException;

public class SessionAlreadyConnectedException extends BaseException {
    public SessionAlreadyConnectedException(String sessionId) {
        super(String.format("Session %s already has an active connection", sessionId), 409);
    }
}
