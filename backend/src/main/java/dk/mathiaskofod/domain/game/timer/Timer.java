package dk.mathiaskofod.domain.game.timer;

import dk.mathiaskofod.domain.game.timer.models.TimerState;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

public class Timer {

    private final Clock clock;

    Instant startTime;
    Instant pauseStartTime;

    TimerState state = TimerState.NOT_STARTED;

    List<Duration> pauses = new ArrayList<>();

    public Timer() {
        this.clock = Clock.systemUTC();
    }

    public Timer(Clock clock) {
        this.clock = clock;
    }

    public Timer(TimerSnapshot snapshot) {
        this.clock = Clock.systemUTC();
        this.startTime = snapshot.startTime();
        this.pauseStartTime = snapshot.pauseStartTime();
        this.state = snapshot.state();
        this.pauses = new ArrayList<>(snapshot.pauses());
    }

    public void start() {
        this.startTime = clock.instant();
        state = TimerState.RUNNING;
    }

    public void pause() {
        if (state != TimerState.RUNNING) {
            return;
        }
        state = TimerState.PAUSED;
        this.pauseStartTime = clock.instant();
    }

    public void resume() {
        if (state != TimerState.PAUSED) {
            return;
        }
        logCurrentPause();
        state = TimerState.RUNNING;
    }

    public void reset() {
        this.startTime = clock.instant();
        pauses = new ArrayList<>();
    }

    /**
     * Returns the total active duration of the timer, excluding any paused time.
     * @return active duration
     */
    public Duration getActiveDuration() {
        if (startTime == null) {
            return Duration.ZERO;
        }
        Duration pauseTime = getTotalPauseDuration();
        return Duration.between(startTime, clock.instant()).minus(pauseTime);
    }

    /**
     * Returns the total duration from the start time to now, including paused time.
     * @return total duration
     */
    Duration getTotalDuration() {
        if (startTime == null) {
            return Duration.ZERO;
        }
        return Duration.between(startTime, clock.instant());
    }

    private void logCurrentPause() {
        pauses.add(getCurrentPauseDuration());
        pauseStartTime = null;
    }

    private Duration getCurrentPauseDuration() {
        if (pauseStartTime == null) {
            return Duration.ZERO;
        }
        return Duration.between(pauseStartTime, clock.instant());
    }

    Duration getTotalPauseDuration() {
        if (startTime == null) {
            return Duration.ZERO;
        }
        return pauses.stream().reduce(Duration::plus).orElse(Duration.ZERO).plus(getCurrentPauseDuration());
    }

    public TimerState getState() {
        return state;
    }
}
