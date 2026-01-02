package dk.mathiaskofod.services.session.player.exeptions;

import dk.mathiaskofod.providers.exceptions.BaseException;

public class PlayerSessionNotFoundException extends BaseException {

    public PlayerSessionNotFoundException(String playerId) {
        super(String.format("Session for player %s could not be found",playerId), 404);
    }
}
