package dk.mathiaskofod.services.session.events.game;

import dk.mathiaskofod.domain.game.deck.models.Card;
import dk.mathiaskofod.domain.game.events.DrawCardEvent;
import dk.mathiaskofod.services.session.models.annotations.EventType;

@EventType("DRAW_CARD")
public record DrawCardGameEventDto(int turn, long durationInMillis, Card newCard, String previousPlayerId, String newPlayerId, String nextPlayerId) implements GameEventDto {

    public static DrawCardGameEventDto fromGameEvent(DrawCardEvent event) {

        return new DrawCardGameEventDto(
                event.turn().round(),
                event.turn().duration().toMillis(),
                event.turn().card(),
                event.previusPlayer().id(),
                event.player().id(),
                event.nextPlayer().id()
        );

    }
}
