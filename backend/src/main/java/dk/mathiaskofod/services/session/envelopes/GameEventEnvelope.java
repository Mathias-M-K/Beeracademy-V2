package dk.mathiaskofod.services.session.envelopes;

import dk.mathiaskofod.services.session.events.game.game.GameEventDto;
import dk.mathiaskofod.services.session.models.annotations.Category;

@Category("GAME_EVENT")
public record GameEventEnvelope(GameEventDto payload) implements WebsocketEnvelope<GameEventDto> {}
