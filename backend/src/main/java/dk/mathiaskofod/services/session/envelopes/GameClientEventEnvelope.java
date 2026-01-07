package dk.mathiaskofod.services.session.envelopes;

import dk.mathiaskofod.services.session.events.gameclient.GameClientEvent;
import dk.mathiaskofod.services.session.models.annotations.Category;

@Category("GAME_CLIENT_EVENT")
public record GameClientEventEnvelope(GameClientEvent payload) implements WebsocketEnvelope {
}
