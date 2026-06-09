package dk.mathiaskofod.services.auth.exceptions;

import dk.mathiaskofod.providers.exceptions.BaseException;

public class RoleNotFoundException extends BaseException {

    public RoleNotFoundException() {
        super("Could not extract role from JWT", 500);
    }
}
