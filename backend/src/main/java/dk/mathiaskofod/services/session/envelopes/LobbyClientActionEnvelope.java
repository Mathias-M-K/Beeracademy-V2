package dk.mathiaskofod.services.session.envelopes;

import dk.mathiaskofod.services.session.actions.lobby.client.LobbyClientAction;
import dk.mathiaskofod.services.session.models.annotations.Category;

@Category("LOBBY_CLIENT_ACTION")
public record LobbyClientActionEnvelope(LobbyClientAction payload) implements WebsocketEnvelope<LobbyClientAction> {}
