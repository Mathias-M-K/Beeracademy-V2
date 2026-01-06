package dk.mathiaskofod.domain.game.events;

public record StartGameEvent(String gameId) implements GameEvent {
}
