package dk.mathiaskofod.services.session.events.client.player;

import dk.mathiaskofod.services.session.models.annotations.EventType;

@EventType("PLAYER_CONNECTED")
public record PlayerConnectedEvent(String playerId, String gameId) implements PlayerClientEvent {
}
