package dk.mathiaskofod.services.session.envelopes;


import dk.mathiaskofod.services.session.models.annotations.Category;
import dk.mathiaskofod.services.session.events.domain.game.GameEventDto;


@Category("GAME_EVENT")
public record GameEventEnvelope(GameEventDto payload) implements WebsocketEnvelope {
}
