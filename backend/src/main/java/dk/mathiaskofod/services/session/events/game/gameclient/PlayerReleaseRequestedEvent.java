package dk.mathiaskofod.services.session.events.game.gameclient;

import dk.mathiaskofod.services.session.models.annotations.EventType;

@EventType("PLAYER_RELEASE_REQUESTED")
public record PlayerReleaseRequestedEvent(String playerId) implements GameClientEvent {
}
