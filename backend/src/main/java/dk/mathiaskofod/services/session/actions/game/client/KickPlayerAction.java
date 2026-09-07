package dk.mathiaskofod.services.session.actions.game.client;

import dk.mathiaskofod.services.session.models.annotations.ActionType;

@ActionType("KICK_PLAYER")
public record KickPlayerAction(String playerId, String reason) implements GameClientAction {
}
