package dk.mathiaskofod.domain.game.timer;

import dk.mathiaskofod.domain.game.timer.exception.TimerNotStartedException;
import dk.mathiaskofod.domain.game.timer.models.TimeReport;
import dk.mathiaskofod.domain.game.timer.models.TimerState;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public class GameTimer {

    TimerState state = TimerState.NOT_STARTED;

    Instant startTime;

    List<Duration> pauses = new ArrayList<>();
    Instant pauseStartTime;

    public void start() {
        this.startTime = Instant.now();
        state = TimerState.RUNNING;
    }

    public void pause() {
        if (startTime == null || pauseStartTime != null) {
            return;
        }
        state = TimerState.PAUSED;
        this.pauseStartTime = Instant.now();
    }

    public void resume() {
        state = TimerState.RUNNING;
        Duration pauseDuration = getCurrentPauseDuration();
        pauses.add(pauseDuration);
        pauseStartTime = null;
    }

    private Duration getCurrentPauseDuration() {
        if (pauseStartTime == null) {
            return Duration.ZERO;
        }
        return Duration.between(pauseStartTime, Instant.now());
    }

    /**
     * Retrieves the actual game-time where the game have been in a non-paused state
     * If the timer has not been started, a {@code TimerNotStartedException} is thrown.
     *
     * @return the elapsed time as a {@code Duration} object since the timer was started,
     *         minus any time during which the timer was paused
     * @throws TimerNotStartedException if the timer has not been started
     */
    public Duration getTime(){
        if (startTime == null) {
            return Duration.ZERO;
        }
        Duration pauseTime = getPausedTime();
        return Duration.between(startTime, Instant.now()).minus(pauseTime);
    }

    /**
     * Calculates the total elapsed time since the timer was started, including all paused durations.
     * If the timer has not been started, a {@code TimerNotStartedException} is thrown.
     *
     * @return the total time as a {@code Duration} object since the timer was started
     * @throws TimerNotStartedException if the timer has not been started
     */
    Duration getTotalTime(){
        if (startTime == null) {
            return Duration.ZERO;
        }
        return Duration.between(startTime, Instant.now());
    }

    /**
     * Calculates the total duration for which the timer has been paused.
     * If the timer has not been started, a {@code TimerNotStartedException} is thrown.
     *
     * @return the total paused time as a {@code Duration} object, or {@code Duration.ZERO} if there were no pauses
     * @throws TimerNotStartedException if the timer has not been started
     */
    Duration getPausedTime(){
        if (startTime == null) {
            return Duration.ZERO;
        }

        return pauses.stream().reduce(Duration::plus).orElse(Duration.ZERO).plus(getCurrentPauseDuration());
    }

    public void reset(){
        this.startTime = Instant.now();
    }

    public TimerState getState() {
        return state;
    }

    public TimeReport getReport(){
        return new TimeReport(state, getTotalTime().toMillis(),getTime().toMillis(),getPausedTime().toMillis());
    }
}
