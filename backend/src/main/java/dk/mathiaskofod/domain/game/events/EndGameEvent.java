package dk.mathiaskofod.domain.game.events;

import dk.mathiaskofod.domain.game.timer.models.TimeReport;

public record EndGameEvent(String gameId, TimeReport timeReport) implements GameEvent{
}
