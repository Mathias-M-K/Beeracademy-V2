package dk.mathiaskofod.domain.game.models;

import dk.mathiaskofod.domain.game.deck.models.Card;

import java.time.Duration;

public record Turn(int round, Card card, Duration duration) {
}
