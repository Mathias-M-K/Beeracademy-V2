package dk.mathiaskofod.domain.game.timer.models;

import java.time.Duration;

public record TimeReport(TimerState state, long elapsedTime, long activeTime, long pausedTime) {

}
