package dk.mathiaskofod.services.session.exceptions;

import dk.mathiaskofod.providers.exceptions.BaseException;

public class UnknownActionException extends BaseException {
    public UnknownActionException(String actionClassName, int httpStatus) {
        super(String.format("Unknown action type: %s", actionClassName), httpStatus);
    }
}
