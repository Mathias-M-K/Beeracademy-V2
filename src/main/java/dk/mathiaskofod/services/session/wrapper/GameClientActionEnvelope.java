package dk.mathiaskofod.services.session.wrapper;

import dk.mathiaskofod.services.session.actions.game.client.GameClientAction;
import dk.mathiaskofod.services.session.models.annotations.Category;

@Category("GAME_CLIENT_ACTION")
public record GameClientActionEnvelope(GameClientAction payload) implements WebsocketEnvelope {
}
