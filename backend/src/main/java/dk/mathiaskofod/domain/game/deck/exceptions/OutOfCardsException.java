package dk.mathiaskofod.domain.game.deck.exceptions;

import dk.mathiaskofod.providers.exceptions.BaseException;

public class OutOfCardsException extends BaseException {
    public OutOfCardsException() {
        super("No more cards available", 204);
    }
}
