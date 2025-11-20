package dk.mathiaskofod.services.session.actions.game.client;

import dk.mathiaskofod.domain.game.deck.models.Suit;
import dk.mathiaskofod.services.session.models.annotations.ActionType;

@ActionType("REGISTER_CHUG")
public record RegisterChugAction(Suit suit, long duration, String playerId) implements GameClientAction {
}
