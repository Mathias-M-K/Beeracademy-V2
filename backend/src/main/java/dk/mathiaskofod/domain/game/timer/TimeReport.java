package dk.mathiaskofod.domain.game.timer;

import dk.mathiaskofod.domain.game.timer.models.TimerState;

import java.time.Duration;
import java.util.List;

public record TimeReport(TimerState state, long elapsedTime, long activeTime, long pausedTime, List<Long> pauses) {

    /**
     * Create a TimeReport representing the given Timer's state and durations in milliseconds.
     *
     * @param timer the Timer to extract state and duration information from
     * @return a TimeReport containing the timer's state, total elapsed time, active time, total paused time, and individual pause durations (all in milliseconds)
     */
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