package dk.mathiaskofod.services.session.envelopes;

import dk.mathiaskofod.services.session.events.lobby.client.LobbyClientEvent;

public record LobbyClientEventEnvelope(LobbyClientEvent payload) implements WebsocketEnvelope<LobbyClientEvent> {}
