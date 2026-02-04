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

    /**
     * Starts the timer by recording the current instant and setting the state to RUNNING.
     */
    public void start() {
        this.startTime = Instant.now();
        state = TimerState.RUNNING;
    }

    /**
     * Pauses the timer if it is currently running.
     *
     * If the timer is running, sets its state to PAUSED and records the pause start time; otherwise does nothing.
     */
    public void pause() {
        if (state != TimerState.RUNNING) {
            return;
        }
        state = TimerState.PAUSED;
        this.pauseStartTime = Instant.now();
    }

    /**
     * Resumes the timer when it is paused.
     *
     * If the timer is paused, records the current pause interval and transitions the timer to RUNNING.
     */
    public void resume() {
        if(state != TimerState.PAUSED) {
            return;
        }
        logCurrentPause();
        state = TimerState.RUNNING;
    }

    /**
     * Reset the timer to start a new timing interval, treating any ongoing pause as completed.
     *
     * Sets the timer's start time to the current instant and clears all recorded pause intervals.
     * If the timer is currently paused, the current pause interval is recorded before the reset.
     */
    public void reset(){
        reset(false);
    }

    /**
     * Resets the timer's start instant and clears all recorded pause intervals.
     *
     * If the timer is currently paused and {@code ignorePause} is {@code false}, the current ongoing pause
     * is recorded before the reset. After this method completes, {@code startTime} is set to the current
     * instant and the list of recorded pauses is cleared.
     *
     * @param ignorePause when {@code true}, discard any ongoing pause; when {@code false}, record the ongoing pause before resetting
     */
    public void reset(boolean ignorePause) {

        if(state == TimerState.PAUSED && !ignorePause) {
            logCurrentPause();
        }

        this.startTime = Instant.now();
        pauses = new ArrayList<>();
    }

    /**
     * Computes the active elapsed time since the timer started, excluding all paused periods.
     *
     * @return the elapsed duration between the start time and now minus total paused duration; `Duration.ZERO` if the timer has not been started
     */
    public Duration getActiveDuration() {
        if (startTime == null) {
            return Duration.ZERO;
        }
        Duration pauseTime = getTotalPauseDuration();
        return Duration.between(startTime, Instant.now()).minus(pauseTime);
    }

    /**
     * Calculate the total elapsed time since the timer was started.
     *
     * @return the duration between the timer's start time and now, or {@link Duration#ZERO} if the timer has not been started
     */
    Duration getTotalDuration() {
        if (startTime == null) {
            return Duration.ZERO;
        }
        return Duration.between(startTime, Instant.now());
    }

    /**
     * Adds the duration of the currently active pause to the recorded pauses and clears the active pause marker.
     *
     * If no pause is in progress (pauseStartTime is null), this method does nothing.
     */
    private void logCurrentPause() {
        if (pauseStartTime == null) {
            return;
        }
        pauses.add(getCurrentPauseDuration());
        pauseStartTime = null;
    }

    /**
     * Compute the duration of the currently active pause.
     *
     * @return the duration from the pause start time to now, or {@code Duration.ZERO} if no pause is active
     */
    private Duration getCurrentPauseDuration(){
        if (pauseStartTime == null) {
            return Duration.ZERO;
        }
        return Duration.between(pauseStartTime, Instant.now());
    }

    /**
     * Compute the total duration spent paused, including an ongoing pause if present.
     *
     * @return the sum of all recorded pause durations plus the current pause duration; `Duration.ZERO` if the timer has not been started
     */
    Duration getTotalPauseDuration() {
        if (startTime == null) {
            return Duration.ZERO;
        }
        return pauses.stream().reduce(Duration::plus).orElse(Duration.ZERO).plus(getCurrentPauseDuration());
    }

    /**
     * Retrieves the timer's current state.
     *
     * @return the current {@link TimerState} of the timer
     */
    public TimerState getState() {
        return state;
    }


}