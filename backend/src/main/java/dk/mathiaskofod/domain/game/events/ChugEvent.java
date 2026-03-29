package dk.mathiaskofod.domain.game.events;

import dk.mathiaskofod.domain.game.models.Chug;
import dk.mathiaskofod.domain.game.player.Player;

public record ChugEvent(Chug chug, Player drawnBy, Player nextToDraw, String gameId) implements GameEvent {
}
