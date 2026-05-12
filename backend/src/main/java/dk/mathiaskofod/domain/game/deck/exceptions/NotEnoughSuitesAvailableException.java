package dk.mathiaskofod.domain.game.deck.exceptions;

import dk.mathiaskofod.domain.game.deck.models.Suit;
import dk.mathiaskofod.providers.exceptions.BaseException;

public class NotEnoughSuitesAvailableException extends BaseException {

    public NotEnoughSuitesAvailableException(int nrOfRequestedSuits) {
        super(
                String.format(
                        "Requested %d suits, but only %d are available", nrOfRequestedSuits, Suit.values().length),
                500);
    }
}
