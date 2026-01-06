package dk.mathiaskofod.services.session.game.exceptions;

import dk.mathiaskofod.providers.exceptions.BaseException;

public class GameSessionNotFoundException extends BaseException {
    public GameSessionNotFoundException(String gameId) {
        super(String.format("Could not find a game session matching ID: %s", gameId), 404);
    }
}
