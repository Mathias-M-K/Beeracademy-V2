package dk.mathiaskofod.services.session.actions.player.client;

import dk.mathiaskofod.services.session.models.annotations.ActionType;

@ActionType("RELINQUISH_PLAYER")
public record RelinquishPlayerAction() implements PlayerClientAction {
}
