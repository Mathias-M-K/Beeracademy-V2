package dk.mathiaskofod.services.session.exceptions;

import dk.mathiaskofod.providers.exceptions.BaseException;

public class UnknownCategoryException extends BaseException {
    public UnknownCategoryException(String message, int httpStatus) {
        super(message, httpStatus);
    }
}
