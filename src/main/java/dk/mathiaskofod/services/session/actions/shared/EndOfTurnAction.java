package dk.mathiaskofod.services.session.actions.shared;

import dk.mathiaskofod.services.session.actions.game.client.GameClientAction;
import dk.mathiaskofod.services.session.actions.player.client.PlayerClientAction;
import dk.mathiaskofod.services.session.models.annotations.ActionType;

@ActionType("END_OF_TURN")
public record EndOfTurnAction(long duration) implements GameClientAction, PlayerClientAction {
}
