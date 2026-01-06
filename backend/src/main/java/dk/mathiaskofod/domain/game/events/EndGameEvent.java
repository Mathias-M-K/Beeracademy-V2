package dk.mathiaskofod.domain.game.events;

import java.time.Duration;

public record EndGameEvent(String gameId, Duration gameTime) implements GameEvent{
}
