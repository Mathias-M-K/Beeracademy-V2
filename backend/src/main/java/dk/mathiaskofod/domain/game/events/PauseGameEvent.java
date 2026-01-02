package dk.mathiaskofod.domain.game.events;

import dk.mathiaskofod.domain.game.models.GameId;

public record PauseGameEvent(GameId gameId) implements GameEvent {
}
