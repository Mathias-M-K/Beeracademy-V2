package dk.mathiaskofod.services.session.events.game.dto;

import dk.mathiaskofod.domain.game.deck.models.Suit;
import dk.mathiaskofod.domain.game.events.ChugEvent;
import dk.mathiaskofod.domain.game.models.GameId;
import dk.mathiaskofod.services.session.models.annotations.EventType;

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
