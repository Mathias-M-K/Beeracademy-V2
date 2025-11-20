package dk.mathiaskofod.domain.game.models;

import dk.mathiaskofod.domain.game.deck.models.Suit;

import java.time.Duration;

public record Chug(Suit suit, Duration chugTime) {
}
