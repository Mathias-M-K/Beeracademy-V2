package dk.mathiaskofod.services.session.models.events.game;

import dk.mathiaskofod.domain.game.deck.models.Suit;
import dk.mathiaskofod.domain.game.events.events.ChugEvent;
import dk.mathiaskofod.services.game.id.generator.models.GameId;
import dk.mathiaskofod.services.session.annotations.EventType;

@EventType("CHUG")
public record ChugGameEventDto(Suit suit, long timeInMillis, String playerId, GameId gameId) implements GameEventDto {

    public static ChugGameEventDto fromGameEvent(ChugEvent event) {
        return new ChugGameEventDto(
            event.chug().card().suit(),
            event.chug().chugTime().toMillis(),
            event.player().id(),
            event.gameId()
        );
    }
}
