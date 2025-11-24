package dk.mathiaskofod.domain.game.events;

import dk.mathiaskofod.domain.game.models.GameId;

import java.time.Duration;

public record EndGameEvent(GameId gameId, Duration gameTime) implements GameEvent{
}
