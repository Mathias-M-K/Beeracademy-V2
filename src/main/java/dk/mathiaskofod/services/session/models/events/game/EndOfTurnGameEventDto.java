package dk.mathiaskofod.services.session.models.events.game;

import dk.mathiaskofod.domain.game.deck.models.Card;
import dk.mathiaskofod.domain.game.events.events.EndOfTurnEvent;
import dk.mathiaskofod.services.session.annotations.EventType;

@EventType("END_OF_TURN")
public record EndOfTurnGameEventDto(int turn, long durationInMillis, Card newCard, String previousPlayerId, String newPlayerId, String nextPlayerId) implements GameEventDto {

    public static EndOfTurnGameEventDto fromGameEvent(EndOfTurnEvent event) {

        return new EndOfTurnGameEventDto(
                event.turn().round(),
                event.turn().duration().toMillis(),
                event.turn().card(),
                event.previusPlayer().id(),
                event.player().id(),
                event.nextPlayer().id()
        );

    }
}
