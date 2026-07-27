package dk.mathiaskofod.services.session.actions.game.common;

import dk.mathiaskofod.services.session.actions.game.client.GameClientAction;
import dk.mathiaskofod.services.session.actions.game.player.PlayerClientAction;
import dk.mathiaskofod.services.session.models.annotations.ActionType;

@ActionType("DRAW_CARD")
public record DrawCardAction(long duration) implements GameClientAction, PlayerClientAction {}
