package dk.mathiaskofod.services.session.game.exceptions;

import dk.mathiaskofod.providers.exceptions.BaseException;

public class GameAlreadyClaimedException extends BaseException {

    public GameAlreadyClaimedException(String gameId) {
        super(String.format("Could not find a game, matching ID: %s", gameId), 400);
    }
}
