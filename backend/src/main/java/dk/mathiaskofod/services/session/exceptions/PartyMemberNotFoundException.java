package dk.mathiaskofod.services.session.exceptions;

import dk.mathiaskofod.providers.exceptions.BaseException;
import jakarta.ws.rs.core.Response;

public class PartyMemberNotFoundException extends BaseException {

    public PartyMemberNotFoundException(String partyId, String participantId) {
        super(String.format("Participant:%s, is not a member of party:%s", participantId, partyId), Response.Status.FORBIDDEN.getStatusCode());
    }
}
