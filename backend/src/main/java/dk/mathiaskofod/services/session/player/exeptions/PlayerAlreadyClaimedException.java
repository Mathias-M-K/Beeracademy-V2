package dk.mathiaskofod.services.session.player.exeptions;

import dk.mathiaskofod.api.game.models.GameIdDto;
import dk.mathiaskofod.providers.exceptions.BaseException;
import lombok.extern.slf4j.Slf4j;


@Slf4j
public class PlayerAlreadyClaimedException extends BaseException {

    public PlayerAlreadyClaimedException(String playerId, String gameId) {
        super(createMessage(playerId, gameId), 409);
    }

    private static String createMessage(String playerId, String gameId) {
        return "Player with ID " + playerId + " from game " + gameId + " has already been claimed.";
    }
}
