package dk.mathiaskofod.services.game.exceptions;

import dk.mathiaskofod.api.game.models.GameIdDto;
import dk.mathiaskofod.providers.exceptions.BaseException;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class PlayerNotFoundException extends BaseException {

    public PlayerNotFoundException(String playerId, String gameId) {
        super(createMessage(playerId, gameId), 404);
    }

    private static String createMessage(String playerId, String gameId) {
        return "Player with ID " + playerId + " in game " + gameId + " not found.";
    }
}
