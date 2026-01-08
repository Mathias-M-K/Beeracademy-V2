package dk.mathiaskofod.services.auth.exceptions;

import dk.mathiaskofod.providers.exceptions.BaseException;

public class TokenException extends BaseException {

    public TokenException(String message, int httpStatus) {
        super(message,httpStatus);
    }
}
