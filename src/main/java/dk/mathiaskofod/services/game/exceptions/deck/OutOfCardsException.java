package dk.mathiaskofod.services.game.exceptions.deck;

import dk.mathiaskofod.providers.exeptions.BaseException;

public class OutOfCardsException extends BaseException {
    public OutOfCardsException() {
        super("No more cards available", 204);
    }
}
