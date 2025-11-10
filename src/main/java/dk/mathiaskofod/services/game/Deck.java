package dk.mathiaskofod.services.game;

import dk.mathiaskofod.services.game.exceptions.deck.NotEnoughSuitesAvailableException;
import dk.mathiaskofod.services.game.exceptions.deck.OutOfCardsException;
import dk.mathiaskofod.services.game.models.Card;
import dk.mathiaskofod.services.game.models.Suit;

import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.List;

public class Deck {

    private static final SecureRandom random = new SecureRandom();

    List<Card> unusedCards;
    List<Card> usedCards = new ArrayList<>();

    public Deck(int nrOfSuits) {
        if(nrOfSuits > Suit.values().length){
            throw new NotEnoughSuitesAvailableException(nrOfSuits);
        }
        unusedCards = generateDeck(nrOfSuits);
    }

    public Card drawCard(){

        if(unusedCards.isEmpty()){
            throw new OutOfCardsException();
        }

        int randomCardIndex = random.nextInt(0,unusedCards.size());
        Card card = unusedCards.get(randomCardIndex);

        usedCards.add(card);
        unusedCards.remove(card);

        return card;
    }

    private static List<Card> generateDeck(int nrOfSuits){

        List<Card> cards = new ArrayList<>();
        for (int suitIndex = 0; suitIndex<nrOfSuits; suitIndex++){

            Suit suit = Suit.values()[suitIndex];

            for (int rank = 2; rank <= 14; rank++) {
                cards.add(new Card(suit,rank));
            }
        }

        return cards;
    }
}
