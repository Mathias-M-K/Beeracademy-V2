package dk.mathiaskofod.domain.game.timer.models;

public record TimeReport(TimerState state, long elapsedTime, long activeTime, long pausedTime) {
    // TODO pausedTime should return individual pauses, not total paused time
}
