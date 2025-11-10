package dk.mathiaskofod.services.player.exeptions;

import dk.mathiaskofod.providers.exeptions.BaseException;
import dk.mathiaskofod.services.game.game.id.generator.models.GameId;
import lombok.extern.slf4j.Slf4j;


@Slf4j
public class PlayerAlreadyClaimedException extends BaseException {

    public PlayerAlreadyClaimedException(String playerId, GameId gameId) {
        super(createMessage(playerId, gameId), 409);
    }

    private static String createMessage(String playerId, GameId gameId) {
        return "Player with ID " + playerId + " from game " + gameId.humanReadableId() + " has already been claimed.";
    }
}
