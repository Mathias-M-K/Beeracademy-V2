package dk.mathiaskofod.services.session.events.game.gameclient;

import dk.mathiaskofod.services.session.models.annotations.EventType;

@EventType("PLAYER_RELEASED")
public record PlayerReleasedEvent(String playerId) implements GameClientEvent {
}
