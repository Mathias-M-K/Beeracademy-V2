package dk.mathiaskofod.domain.game.events;

import dk.mathiaskofod.domain.game.models.Chug;
import dk.mathiaskofod.domain.game.player.Player;
import dk.mathiaskofod.domain.game.models.GameId;

public record ChugEvent(Chug chug, Player player, GameId gameId) implements GameEvent {
}
