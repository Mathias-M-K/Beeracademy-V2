package dk.mathiaskofod.services.session.actions.game.client;

import dk.mathiaskofod.services.session.models.annotations.ActionType;

@ActionType("PAUSE_GAME")
public record StartGameAction() implements GameClientAction {
}
