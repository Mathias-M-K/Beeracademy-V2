package dk.mathiaskofod.domain.game.events;

import dk.mathiaskofod.domain.game.models.Turn;
import dk.mathiaskofod.domain.game.player.Player;

public record DrawCardEvent(Turn turn, Player previusPlayer, Player player, Player nextPlayer, String gameId) implements GameEvent {
}
