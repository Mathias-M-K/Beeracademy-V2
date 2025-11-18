package dk.mathiaskofod.services.session.events.game.dto.exceptions;

import dk.mathiaskofod.providers.exceptions.BaseException;
import dk.mathiaskofod.domain.game.models.GameId;

public class GameAlreadyClaimedException extends BaseException {

    public GameAlreadyClaimedException(GameId gameId) {
        super(String.format("Could not find a game, matching ID: %s", gameId.humanReadableId()), 400);
    }
}
