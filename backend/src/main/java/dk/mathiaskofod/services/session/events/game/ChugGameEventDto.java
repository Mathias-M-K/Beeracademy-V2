package dk.mathiaskofod.services.session.events.game;

import dk.mathiaskofod.domain.game.events.ChugEvent;
import dk.mathiaskofod.domain.game.models.Chug;
import dk.mathiaskofod.services.session.models.annotations.EventType;

@EventType("CHUG")
public record ChugGameEventDto(Chug chug, String drawnBy, String nextToDraw) implements GameEventDto {

    public static ChugGameEventDto fromGameEvent(ChugEvent event) {
        return new ChugGameEventDto(
                event.chug(),
                event.drawnBy().id(),
                event.nextToDraw().id()
        );
    }
}
