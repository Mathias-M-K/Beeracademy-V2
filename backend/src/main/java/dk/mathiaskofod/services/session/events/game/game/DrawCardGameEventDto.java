package dk.mathiaskofod.services.session.events.game.game;

import dk.mathiaskofod.domain.game.events.DrawCardEvent;
import dk.mathiaskofod.domain.game.models.Turn;
import dk.mathiaskofod.services.session.models.annotations.EventType;

@EventType("DRAW_CARD")
public record DrawCardGameEventDto(Turn turn, String drawnBy, String nextToDraw, String nextAfter)
        implements GameEventDto {

    public static DrawCardGameEventDto fromGameEvent(DrawCardEvent event) {

        return new DrawCardGameEventDto(
                event.turn(),
                event.drawnBy().id(),
                event.nextToDraw().id(),
                event.nextAfter().id());
    }
}
