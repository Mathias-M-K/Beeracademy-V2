package dk.mathiaskofod.services.session.events.gameclient;

import dk.mathiaskofod.domain.game.Game;
import dk.mathiaskofod.services.session.models.annotations.EventType;

@EventType("CLIENT_CONNECTED")
public record GameClientConnectedEvent(Game game) implements GameClientEvent {
}
