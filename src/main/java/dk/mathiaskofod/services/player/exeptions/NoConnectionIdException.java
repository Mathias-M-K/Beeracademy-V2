package dk.mathiaskofod.services.player.exeptions;

import dk.mathiaskofod.providers.exeptions.BaseException;
import dk.mathiaskofod.services.game.game.id.generator.models.GameId;
import dk.mathiaskofod.services.game.models.Game;

public class NoConnectionIdException extends BaseException {

    public NoConnectionIdException(String playerId, GameId gameId) {
        super(createMessage(playerId, gameId), 500);
    }

    private static String createMessage(String playerId, GameId gameId) {
        return "No connection exist for player " + playerId + " in game " + gameId.humanReadableId();
    }
}
