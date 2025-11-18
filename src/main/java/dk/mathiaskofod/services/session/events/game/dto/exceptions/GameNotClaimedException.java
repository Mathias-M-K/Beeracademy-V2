package dk.mathiaskofod.services.session.events.game.dto.exceptions;

import dk.mathiaskofod.providers.exceptions.BaseException;
import dk.mathiaskofod.domain.game.models.GameId;

public class GameNotClaimedException extends BaseException {

    public GameNotClaimedException(GameId gameId) {
        super(String.format("Can't connect to game %s, as it has not been claimed", gameId.humanReadableId()), 400);
    }
}
