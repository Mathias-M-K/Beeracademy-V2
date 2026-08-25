package dk.mathiaskofod.services.lobby.exceptions;

import dk.mathiaskofod.providers.exceptions.BaseException;

public class LobbyNotFoundException extends BaseException {
    public LobbyNotFoundException(String partyId) {
        super("Lobby with ID " + partyId + " not found.", 400);
    }
}
