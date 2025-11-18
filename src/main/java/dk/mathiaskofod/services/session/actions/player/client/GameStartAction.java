package dk.mathiaskofod.services.session.actions.player.client;

import dk.mathiaskofod.services.session.models.annotations.ActionType;

@ActionType("GAME_START")
public record GameStartAction() implements PlayerClientAction {
}
