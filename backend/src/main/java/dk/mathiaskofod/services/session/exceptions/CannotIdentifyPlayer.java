package dk.mathiaskofod.services.session.exceptions;

import dk.mathiaskofod.providers.exceptions.BaseException;

public class CannotIdentifyPlayer extends BaseException {
    public CannotIdentifyPlayer(String message, int statusCode) {
        super(message, statusCode);
    }
}
