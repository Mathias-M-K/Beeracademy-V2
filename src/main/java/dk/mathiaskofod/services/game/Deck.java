package dk.mathiaskofod.services.game;

import dk.mathiaskofod.services.game.models.Card;
import dk.mathiaskofod.services.game.models.Suit;
import lombok.Getter;

import java.util.ArrayList;
import java.util.List;

public class Deck {

    List<Card> cards = new ArrayList<>();

    public Deck(int nrOfSuits) {

        for (int suitIndex = 0; suitIndex<nrOfSuits; suitIndex++){

            Suit suit = Suit.values()[suitIndex];

            for (int rank = 1; rank <= 14; rank++) {
                cards.add(new Card(suit,rank));
            }
        }
    }
}
