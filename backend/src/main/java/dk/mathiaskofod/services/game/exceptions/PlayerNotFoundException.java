package dk.mathiaskofod.services.game.exceptions;

import dk.mathiaskofod.providers.exceptions.BaseException;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class PlayerNotFoundException extends BaseException {

    public PlayerNotFoundException(String playerId, String partyId) {
        super(createMessage(playerId, partyId), 404);
    }

    private static String createMessage(String playerId, String partyId) {
        return "Player with ID " + playerId + " in game " + partyId + " not found.";
    }
}
