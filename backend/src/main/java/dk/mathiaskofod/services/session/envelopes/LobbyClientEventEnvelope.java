package dk.mathiaskofod.services.session.envelopes;

import dk.mathiaskofod.services.session.events.lobby.client.LobbyClientEvent;
import dk.mathiaskofod.services.session.models.annotations.Category;

@Category("LOBBY_CLIENT_EVENT")
public record LobbyClientEventEnvelope(LobbyClientEvent payload) implements WebsocketEnvelope<LobbyClientEvent> {}
