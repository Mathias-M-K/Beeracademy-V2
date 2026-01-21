package dk.mathiaskofod.domain.game.timer.models;

public record TimeReport(TimerState state, long elapsedTime, long activeTime, long pausedTime) {

}
