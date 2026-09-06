package dk.mathiaskofod.services.session.events.game.gameclient;

import dk.mathiaskofod.services.session.models.annotations.EventType;

@EventType("PLAYER_KICKED")
public record PlayerKickedEvent(String playerId, String reason) implements GameClientEvent {
}
