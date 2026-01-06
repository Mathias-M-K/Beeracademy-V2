package dk.mathiaskofod.domain.game.events;

public record ResumeGameEvent(String gameId) implements GameEvent {
}
