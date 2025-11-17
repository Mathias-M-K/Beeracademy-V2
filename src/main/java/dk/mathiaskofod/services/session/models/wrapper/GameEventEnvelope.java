package dk.mathiaskofod.services.session.models.wrapper;


import dk.mathiaskofod.services.session.annotations.EventCategory;
import dk.mathiaskofod.services.session.models.events.game.GameEventDto;


@EventCategory("GAME_EVENT")
public record GameEventEnvelope(GameEventDto payload) implements WebsocketEnvelope {
}
