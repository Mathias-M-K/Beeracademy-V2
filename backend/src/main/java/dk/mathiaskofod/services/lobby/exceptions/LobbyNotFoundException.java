package dk.mathiaskofod.services.lobby.exceptions;

import dk.mathiaskofod.providers.exceptions.BaseException;

public class LobbyNotFoundException extends BaseException {
    public LobbyNotFoundException(String lobbyId) {
        super("Lobby with ID " + lobbyId + " not found.", 400);
    }
}
