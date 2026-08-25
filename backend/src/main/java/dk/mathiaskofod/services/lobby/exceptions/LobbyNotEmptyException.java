package dk.mathiaskofod.services.lobby.exceptions;

import dk.mathiaskofod.providers.exceptions.BaseException;

public class LobbyNotEmptyException extends BaseException {
    public LobbyNotEmptyException(String partyId) {
        super("Lobby with id: " + partyId + ", is not empty, and can't be deleted", 405);
    }
}
