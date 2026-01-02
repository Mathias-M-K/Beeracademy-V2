package dk.mathiaskofod.services.session.actions.game.client;

import dk.mathiaskofod.services.session.models.annotations.ActionType;

@ActionType("RESUME_GAME")
public record ResumeGameAction() implements GameClientAction {
}
