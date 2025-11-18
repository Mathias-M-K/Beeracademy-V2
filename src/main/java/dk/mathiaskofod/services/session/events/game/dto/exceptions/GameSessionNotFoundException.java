package dk.mathiaskofod.services.session.events.game.dto.exceptions;

import dk.mathiaskofod.providers.exceptions.BaseException;
import dk.mathiaskofod.domain.game.models.GameId;

public class GameSessionNotFoundException extends BaseException {
    public GameSessionNotFoundException(GameId gameId) {
        super(String.format("Could not find a game session matching ID: %s", gameId.humanReadableId()), 404);
    }
}
