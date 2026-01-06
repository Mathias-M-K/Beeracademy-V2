package dk.mathiaskofod.services.session.player.exeptions;

import dk.mathiaskofod.providers.exceptions.BaseException;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class PlayerNotClaimedException extends BaseException {

    public PlayerNotClaimedException(String playerId, String gameId) {
        super(createMessage(playerId, gameId), 401);
    }

    private static String createMessage(String playerId, String gameId){
        return "Player " + playerId + " in game " + gameId + " have not been claimed";
    }
}
