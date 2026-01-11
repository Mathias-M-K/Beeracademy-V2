package dk.mathiaskofod.domain.game.models;

import dk.mathiaskofod.domain.game.deck.models.Card;

public record Turn(int round, Card card, long durationInMillis) {
}
