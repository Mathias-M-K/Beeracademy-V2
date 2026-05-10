package dk.mathiaskofod.domain.game.deck;

import dk.mathiaskofod.domain.game.deck.models.Card;

import java.util.ArrayList;
import java.util.List;

public record DeckSnapshot(List<Card> unusedCards, List<Card> usedCards) {

    public static DeckSnapshot of(Deck deck) {
        return new DeckSnapshot(
            new ArrayList<>(deck.unusedCards),
            new ArrayList<>(deck.usedCards)
        );
    }
}
