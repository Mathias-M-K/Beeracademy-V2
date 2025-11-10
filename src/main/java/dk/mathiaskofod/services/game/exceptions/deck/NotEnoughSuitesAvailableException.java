package dk.mathiaskofod.services.game.exceptions.deck;

import dk.mathiaskofod.providers.exeptions.BaseException;
import dk.mathiaskofod.services.game.models.Suit;

public class NotEnoughSuitesAvailableException extends BaseException {

    public NotEnoughSuitesAvailableException(int nrOfRequestedSuites) {
        super(nrOfRequestedSuites + " was requested, but only " + Suit.values().length + " is available", 500);
    }
}
