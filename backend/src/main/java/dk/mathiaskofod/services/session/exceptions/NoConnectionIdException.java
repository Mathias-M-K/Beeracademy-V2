package dk.mathiaskofod.services.session.exceptions;

import dk.mathiaskofod.providers.exceptions.BaseException;
import dk.mathiaskofod.domain.game.models.GameId;

public class NoConnectionIdException extends BaseException {

    public NoConnectionIdException(String playerId) {
        super(String.format("No connection ID exist for player %s", playerId), 404);
    }

    public NoConnectionIdException(GameId gameId){
        super(String.format("No connection ID exist for game %s", gameId.humanReadableId()),404);
    }
}
