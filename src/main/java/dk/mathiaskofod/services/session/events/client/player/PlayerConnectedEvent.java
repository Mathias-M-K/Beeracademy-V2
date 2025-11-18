package dk.mathiaskofod.services.session.events.client.player;

import dk.mathiaskofod.domain.game.models.GameId;
import dk.mathiaskofod.services.session.models.annotations.EventType;

@EventType("PLAYER_CONNECTED")
public record PlayerConnectedEvent(String player, GameId gameId) implements PlayerClientEvent {
}
