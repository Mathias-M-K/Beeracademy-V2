package dk.mathiaskofod.domain.game.timer.models;

import java.util.List;

public record TimeReport(TimerState state, long elapsedTime, long activeTime, long pausedTime, List<Long> pauses) {

}
