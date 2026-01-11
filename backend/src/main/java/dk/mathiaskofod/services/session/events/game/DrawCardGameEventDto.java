package dk.mathiaskofod.services.session.events.game;

import dk.mathiaskofod.domain.game.deck.models.Card;
import dk.mathiaskofod.domain.game.events.DrawCardEvent;
import dk.mathiaskofod.domain.game.models.Turn;
import dk.mathiaskofod.services.session.models.annotations.EventType;

@EventType("DRAW_CARD")
public record DrawCardGameEventDto(Turn turn, String previousPlayerId, String newPlayerId, String nextPlayerId) implements GameEventDto {

    public static DrawCardGameEventDto fromGameEvent(DrawCardEvent event) {

        return new DrawCardGameEventDto(
                event.turn(),
                event.previusPlayer().id(),
                event.player().id(),
                event.nextPlayer().id()
        );

    }
}
