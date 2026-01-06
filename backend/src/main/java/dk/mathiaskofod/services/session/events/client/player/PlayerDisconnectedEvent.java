package dk.mathiaskofod.services.session.events.client.player;

import dk.mathiaskofod.services.session.models.annotations.EventType;

@EventType("PLAYER_DISCONNECTED")
public record PlayerDisconnectedEvent(String playerId, String gameId) implements PlayerClientEvent{
}
