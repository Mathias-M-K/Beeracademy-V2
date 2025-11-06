package dk.mathiaskofod.services.game.models;

import java.time.Duration;

public record Turn(int round, Suit suit, int sips, Duration waitTime) {
}
