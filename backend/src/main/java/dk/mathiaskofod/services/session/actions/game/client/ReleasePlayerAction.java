package dk.mathiaskofod.services.session.actions.game.client;

import dk.mathiaskofod.services.session.models.annotations.ActionType;

@ActionType("RELEASE_PLAYER")
public record ReleasePlayerAction(String playerId) implements GameClientAction {
}
