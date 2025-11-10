package dk.mathiaskofod.services.game.exceptions;

import dk.mathiaskofod.providers.exeptions.BaseException;
import dk.mathiaskofod.services.game.game.id.generator.models.GameId;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class GameNotFoundException extends BaseException {

    public GameNotFoundException(GameId gameId) {
        super(createMessage(gameId.humanReadableId()), 404);
    }

    private static String createMessage(String gameId) {
        String humanReadableId = new GameId(gameId).humanReadableId();
        return "Game with id " + humanReadableId + " not found";
    }
}
