package dk.mathiaskofod.domain.game.deck.exceptions;

import dk.mathiaskofod.providers.exceptions.BaseException;
import dk.mathiaskofod.domain.game.deck.models.Suit;

public class NotEnoughSuitesAvailableException extends BaseException {

    public NotEnoughSuitesAvailableException(int nrOfRequestedSuits) {
        super(String.format("Requested %d suits, but only %d are available", nrOfRequestedSuits, Suit.values().length), 500);
    }
}
