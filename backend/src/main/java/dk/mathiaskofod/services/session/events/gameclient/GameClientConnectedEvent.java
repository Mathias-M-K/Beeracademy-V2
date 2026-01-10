package dk.mathiaskofod.services.session.events.gameclient;

import dk.mathiaskofod.common.dto.game.GameDto;
import dk.mathiaskofod.services.session.models.annotations.EventType;

@EventType("CLIENT_CONNECTED")
public record GameClientConnectedEvent(GameDto game) implements GameClientEvent {
}
