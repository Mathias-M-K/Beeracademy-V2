package dk.mathiaskofod.domain.game.events;

import dk.mathiaskofod.domain.game.models.GameId;

public record StartGameEvent(GameId gameId) implements GameEvent {
}
