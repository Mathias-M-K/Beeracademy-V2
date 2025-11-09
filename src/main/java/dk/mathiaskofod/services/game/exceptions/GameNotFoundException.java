package dk.mathiaskofod.services.game.exceptions;

import dk.mathiaskofod.providers.exeptions.BaseException;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class GameNotFoundException extends BaseException {

    public GameNotFoundException(String message, int httpStatus) {
        super(message, httpStatus);
        log.warn(message);
    }
}
