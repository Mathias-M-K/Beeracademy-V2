package dk.mathiaskofod.domain.game.timer;

import dk.mathiaskofod.domain.game.timer.models.TimerState;

import java.time.Duration;
import java.util.List;

public record TimeReport(TimerState state, long elapsedTime, long activeTime, long pausedTime, List<Long> pauses) {

    public static TimeReport createReport(Timer timer) {
        List<Long> pausesAsLong = timer.pauses.stream().map(Duration::toMillis).toList();
        return new TimeReport(
                timer.state,
                timer.getTotalDuration().toMillis(),
                timer.getActiveDuration().toMillis(),
                timer.getTotalPauseDuration().toMillis(),
                pausesAsLong);
    }

}
