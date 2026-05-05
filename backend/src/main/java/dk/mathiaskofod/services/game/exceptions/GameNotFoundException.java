package dk.mathiaskofod.services.game.exceptions;

import dk.mathiaskofod.providers.exceptions.BaseException;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class GameNotFoundException extends BaseException {

    public GameNotFoundException(String gameId) {
        super(createMessage(gameId), 404);
    }

    private static String createMessage(String gameId) {
        return "Game with gameId " + gameId + " not found";
    }
}
