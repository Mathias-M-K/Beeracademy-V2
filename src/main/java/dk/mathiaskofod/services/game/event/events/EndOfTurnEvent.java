package dk.mathiaskofod.services.game.event.events;

import com.fasterxml.jackson.annotation.JsonUnwrapped;
import dk.mathiaskofod.services.game.id.generator.models.GameId;
import dk.mathiaskofod.services.game.models.Card;

import java.time.Duration;

public record EndOfTurnEvent(long elapsedTimeMillis, Card card, String newPlayerId, @JsonUnwrapped GameId gameId) implements GameEvent {
}
