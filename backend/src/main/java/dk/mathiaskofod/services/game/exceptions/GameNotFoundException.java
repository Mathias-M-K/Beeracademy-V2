package dk.mathiaskofod.services.game.exceptions;

import dk.mathiaskofod.providers.exceptions.BaseException;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class GameNotFoundException extends BaseException {

    public GameNotFoundException(String partyId) {
        super(createMessage(partyId), 404);
    }

    private static String createMessage(String partyId) {
        return "Game with partyId " + partyId + " not found";
    }
}
