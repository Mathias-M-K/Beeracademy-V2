package dk.mathiaskofod.domain.game.timer.exception;

import dk.mathiaskofod.providers.exceptions.BaseException;

public class TimerNotStartedException extends BaseException {

    public TimerNotStartedException() {
        super("Timer has not been started.", 400);
    }
}
