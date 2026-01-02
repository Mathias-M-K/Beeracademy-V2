package dk.mathiaskofod.services.session.envelopes;

import dk.mathiaskofod.services.session.events.client.player.PlayerClientEvent;
import dk.mathiaskofod.services.session.models.annotations.Category;

@Category("PLAYER_CLIENT_EVENT")
public record PlayerClientEventEnvelope(PlayerClientEvent payload) implements WebsocketEnvelope {
}
