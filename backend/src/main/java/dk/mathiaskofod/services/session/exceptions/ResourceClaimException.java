package dk.mathiaskofod.services.session.exceptions;

import dk.mathiaskofod.providers.exceptions.BaseException;

public class ResourceClaimException extends BaseException {

    public ResourceClaimException(String msg) {
        super(msg, 400);
    }
}
