package dk.mathiaskofod.domain.game.events;

import dk.mathiaskofod.domain.game.models.GameId;

public interface GameEvent {
    GameId gameId();
}
