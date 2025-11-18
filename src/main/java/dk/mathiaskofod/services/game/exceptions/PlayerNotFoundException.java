package dk.mathiaskofod.services.game.exceptions;

import dk.mathiaskofod.providers.exceptions.BaseException;
import dk.mathiaskofod.domain.game.models.GameId;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class PlayerNotFoundException extends BaseException {

    public PlayerNotFoundException(String playerId, GameId gameId) {
        super(createMessage(playerId, gameId), 404);
    }

    private static String createMessage(String playerId, GameId gameId) {
        return "Player with ID " + playerId + " in game " + gameId.humanReadableId() + " not found.";
    }
}
