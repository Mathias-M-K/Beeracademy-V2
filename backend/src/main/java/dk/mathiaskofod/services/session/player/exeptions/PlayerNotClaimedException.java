package dk.mathiaskofod.services.session.player.exeptions;

import dk.mathiaskofod.providers.exceptions.BaseException;
import dk.mathiaskofod.domain.game.models.GameId;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class PlayerNotClaimedException extends BaseException {

    public PlayerNotClaimedException(String playerId, GameId gameId) {
        super(createMessage(playerId,gameId), 401);
    }

    private static String createMessage(String playerId, GameId gameId){
        return "Player " + playerId + " in game " + gameId.humanReadableId() + " have not been claimed";
    }
}
