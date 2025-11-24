package dk.mathiaskofod.services.session.actions.game.client;

import dk.mathiaskofod.services.session.models.annotations.ActionType;

@ActionType("END_GAME")
public record EndGameAction() implements GameClientAction {
}
