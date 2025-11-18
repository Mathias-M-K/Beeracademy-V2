package dk.mathiaskofod.domain.game.events;

import dk.mathiaskofod.domain.game.models.GameId;

public record EndGameEvent(GameId gameId) implements GameEvent{
}
