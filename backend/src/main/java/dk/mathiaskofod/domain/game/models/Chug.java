package dk.mathiaskofod.domain.game.models;

import dk.mathiaskofod.domain.game.deck.models.Suit;

public record Chug(Suit suit, long chugTimeMillis) {
}
