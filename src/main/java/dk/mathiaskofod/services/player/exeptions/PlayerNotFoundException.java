package dk.mathiaskofod.services.player.exeptions;

import dk.mathiaskofod.providers.exeptions.BaseException;
import dk.mathiaskofod.services.game.id.generator.models.GameId;
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
