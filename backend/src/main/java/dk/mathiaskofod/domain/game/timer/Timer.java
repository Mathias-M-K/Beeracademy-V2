package dk.mathiaskofod.domain.game.timer;

import dk.mathiaskofod.domain.game.timer.models.TimerState;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

public class Timer {

    Instant startTime;
    Instant pauseStartTime;

    TimerState state = TimerState.NOT_STARTED;

    List<Duration> pauses = new ArrayList<>();

    public void start() {
        this.startTime = Instant.now();
        state = TimerState.RUNNING;
    }

    public void pause() {
        if (state != TimerState.RUNNING) {
            return;
        }
        state = TimerState.PAUSED;
        this.pauseStartTime = Instant.now();
    }

    public void resume() {
        if(state != TimerState.PAUSED) {
            return;
        }
        logCurrentPause();
        state = TimerState.RUNNING;
    }

    public void reset() {

        if(state == TimerState.PAUSED) {
            logCurrentPause();
        }

        this.state = TimerState.RUNNING;
        this.startTime = Instant.now();
        pauses = new ArrayList<>();
    }

    public Duration getActiveDuration() {
        if (startTime == null) {
            return Duration.ZERO;
        }
        Duration pauseTime = getTotalPauseDuration();
        return Duration.between(startTime, Instant.now()).minus(pauseTime);
    }

    Duration getTotalDuration() {
        if (startTime == null) {
            return Duration.ZERO;
        }
        return Duration.between(startTime, Instant.now());
    }

    private void logCurrentPause() {
        if (pauseStartTime == null) {
            return;
        }
        pauses.add(getCurrentPauseDuration());
        pauseStartTime = null;
    }

    private Duration getCurrentPauseDuration(){
        if (pauseStartTime == null) {
            return Duration.ZERO;
        }
        return Duration.between(pauseStartTime, Instant.now());
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
