package dk.mathiaskofod.services.session.envelopes;

import dk.mathiaskofod.services.session.actions.player.client.PlayerClientAction;
import dk.mathiaskofod.services.session.models.annotations.Category;

@Category("PLAYER_CLIENT_ACTION")
public record PlayerClientActionEnvelope(PlayerClientAction payload) implements WebsocketEnvelope {
}
