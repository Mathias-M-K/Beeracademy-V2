package dk.mathiaskofod.services.party.exceptions;

import dk.mathiaskofod.providers.exceptions.BaseException;

public class PartyNotFoundException extends BaseException {
    public PartyNotFoundException(String partyId) {
        super("Party " + partyId + " was not found", 404);
    }
}
