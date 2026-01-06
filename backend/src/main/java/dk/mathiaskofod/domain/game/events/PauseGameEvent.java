package dk.mathiaskofod.domain.game.events;

public record PauseGameEvent(String gameId) implements GameEvent {
}
