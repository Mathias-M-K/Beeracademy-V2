package dk.mathiaskofod.services.session.exceptions;

import dk.mathiaskofod.providers.exceptions.BaseException;

public class UnknownEventException extends BaseException {
    public UnknownEventException(String eventClassName, int httpStatus) {
        super(String.format("Unknown event type: %s", eventClassName), httpStatus);
    }
}
