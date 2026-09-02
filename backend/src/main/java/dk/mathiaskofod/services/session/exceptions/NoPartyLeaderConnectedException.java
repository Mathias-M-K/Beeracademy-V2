package dk.mathiaskofod.services.session.exceptions;

import dk.mathiaskofod.providers.exceptions.BaseException;
import jakarta.ws.rs.core.Response;

public class NoPartyLeaderConnectedException extends BaseException {
    public NoPartyLeaderConnectedException(String message, Response.Status status) {
        super(message, status.getStatusCode());
    }
}
