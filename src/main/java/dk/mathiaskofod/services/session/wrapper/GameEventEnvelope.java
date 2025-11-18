package dk.mathiaskofod.services.session.wrapper;


import dk.mathiaskofod.services.session.models.annotations.Category;
import dk.mathiaskofod.services.session.events.game.dto.GameEventDto;


@Category("GAME_EVENT")
public record GameEventEnvelope(GameEventDto payload) implements WebsocketEnvelope {
}
