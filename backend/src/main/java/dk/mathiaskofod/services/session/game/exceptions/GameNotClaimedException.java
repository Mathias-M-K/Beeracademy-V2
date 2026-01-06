package dk.mathiaskofod.services.session.game.exceptions;

import dk.mathiaskofod.providers.exceptions.BaseException;
import dk.mathiaskofod.api.game.models.GameIdDto;

public class GameNotClaimedException extends BaseException {

    public GameNotClaimedException(String gameId) {
        super(String.format("Can't connect to game %s, as it has not been claimed", gameId), 400);
    }
}
