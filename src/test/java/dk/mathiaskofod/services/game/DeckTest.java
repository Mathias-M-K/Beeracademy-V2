package dk.mathiaskofod.services.game;

import dk.mathiaskofod.services.game.exceptions.deck.NotEnoughSuitesAvailableException;
import dk.mathiaskofod.services.game.exceptions.deck.OutOfCardsException;
import dk.mathiaskofod.services.game.models.Card;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.is;
import static org.junit.jupiter.api.Assertions.assertThrows;

class DeckTest {

    private static final int NR_OF_CARDS_IN_A_SUIT = 13;

    @Test
    @DisplayName("Deck can consist of 12 suits")
    void deckCanConsistOfTwelveSuits() {

        //Arrange
        int nrOfSuits = 12;

        //Act
        Deck deck = new Deck(nrOfSuits);

        //Assert
        assertThat(deck.unusedCards.size(), is(NR_OF_CARDS_IN_A_SUIT*nrOfSuits));

    }

    @Test
    @DisplayName("Deck can not consist of 13 suits")
    void deckCanNotConsistOfTwelveSuits() {

        //Arrange
        int nrOfSuits = 13;

        //Act - Assert
        assertThrows(NotEnoughSuitesAvailableException.class, () -> {
            new Deck(nrOfSuits);
        });
    }

    @Test
    @DisplayName("Can't draw card if no cards are available")
    void cantDrawCardsIfNoCardsAreAvailable(){

        //Arrange
        int nrOfSuits = 4;
        int totalNumberOfCards = NR_OF_CARDS_IN_A_SUIT * nrOfSuits;
        Deck deck = new Deck(nrOfSuits);

        //Act
        for(int card = 0; card < totalNumberOfCards; card++){
            deck.drawCard();
        }

        //Assert
        assertThrows(OutOfCardsException.class, deck::drawCard);
    }

    @Test
    @DisplayName("Used cards are added to the used cards list")
    void usedCardsAreaAddedToTheUsedCardsList(){

        //Arrange
        Deck deck = new Deck(4);

        System.out.println(deck.unusedCards);

        //Act
        Card card = deck.drawCard();

        //Assert
        assertThat(deck.unusedCards.contains(card),is(false));
        assertThat(deck.usedCards.contains(card),is(true));

    }

}