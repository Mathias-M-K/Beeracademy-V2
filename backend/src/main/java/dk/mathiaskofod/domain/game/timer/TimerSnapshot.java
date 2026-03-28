package dk.mathiaskofod.domain.game.timer;

import dk.mathiaskofod.domain.game.timer.models.TimerState;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

public record TimerSnapshot(
        Instant startTime,
        Instant pauseStartTime,
        TimerState state,
        List<Duration> pauses
) {
}
