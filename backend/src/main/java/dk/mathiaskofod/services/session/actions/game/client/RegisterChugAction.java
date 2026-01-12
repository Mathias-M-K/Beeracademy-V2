package dk.mathiaskofod.services.session.actions.game.client;

import dk.mathiaskofod.domain.game.deck.models.Suit;
import dk.mathiaskofod.domain.game.models.Chug;
import dk.mathiaskofod.services.session.models.annotations.ActionType;

@ActionType("REGISTER_CHUG")
public record RegisterChugAction(Chug chug) implements GameClientAction {
}
