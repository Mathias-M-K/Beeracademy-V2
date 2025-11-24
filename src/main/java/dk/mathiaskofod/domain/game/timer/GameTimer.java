package dk.mathiaskofod.domain.game.timer;

import dk.mathiaskofod.domain.game.timer.exception.TimerNotStartedException;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

public class GameTimer {

    private Instant startTime;

    List<Duration> pauses = new ArrayList<>();
    Instant pauseStartTime;

    public void start() {
        this.startTime = Instant.now();
    }

    public void pause() {
        if (startTime == null || pauseStartTime != null) {
            return;
        }
        this.pauseStartTime = Instant.now();
    }

    public void resume() {

        if (pauseStartTime == null) {
            return;
        }
        Duration pauseDuration = Duration.between(pauseStartTime, Instant.now());
        pauses.add(pauseDuration);
        pauseStartTime = null;
    }

    public Duration getTime(){
        if (startTime == null) {
            throw new TimerNotStartedException();
        }
        Duration pauseTime = pauses.stream().reduce(Duration::plus).orElse(Duration.ZERO);
        return Duration.between(startTime, Instant.now()).minus(pauseTime);
    }

    public void reset(){
        this.startTime = Instant.now();
    }
}
