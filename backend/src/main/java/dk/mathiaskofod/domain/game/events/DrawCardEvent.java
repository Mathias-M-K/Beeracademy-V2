package dk.mathiaskofod.domain.game.events;

import dk.mathiaskofod.domain.game.models.Turn;
import dk.mathiaskofod.domain.game.player.Player;

public record DrawCardEvent(Turn turn, Player drawnBy, Player nextToDraw, Player nextAfter, String gameId) implements GameEvent {
}
