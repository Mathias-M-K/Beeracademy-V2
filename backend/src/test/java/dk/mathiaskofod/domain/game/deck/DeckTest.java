package dk.mathiaskofod.domain.game.deck;

import dk.mathiaskofod.domain.game.deck.exceptions.NotEnoughSuitesAvailableException;
import dk.mathiaskofod.domain.game.deck.exceptions.OutOfCardsException;
import dk.mathiaskofod.domain.game.deck.models.Card;
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
        NotEnoughSuitesAvailableException exception = assertThrows(NotEnoughSuitesAvailableException.class, () -> new Deck(nrOfSuits));

        assertThat(exception.getMessage(), is("Requested 13 suits, but only 12 are available"));
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

    @Test
    @DisplayName("A deck with one suit has 13 cards")
    void deckWithOneSuitHasThirteenCards(){

        //Arrange
        Deck deck = new Deck(1);

        //Act
        int remainingCards = deck.getRemainingCards();

        //Assert
        assertThat(remainingCards,is(13));
    }

    @Test
    @DisplayName("Deck has one card less after drawing a card")
    void deckHasOneCardLessAfterDrawingACard(){

        //Arrange
        Deck deck = new Deck(1);
        int initialNumberOfCards = deck.getRemainingCards();

        //Act
        deck.drawCard();
        int remainingCards = deck.getRemainingCards();

        //Assert
        assertThat(remainingCards,is(initialNumberOfCards-1));
    }

    @Test
    @DisplayName("Deck is empty after drawing all cards")
    void deckIsEmptyAfterDrawingAllCards(){
        //Arrange
        int nrOfSuits = 1;
        Deck deck = new Deck(nrOfSuits);
        int totalNumberOfCards = NR_OF_CARDS_IN_A_SUIT * nrOfSuits;

        //Act
        for(int card = 0; card < totalNumberOfCards; card++){
            deck.drawCard();
        }

        //Assert
        assertThat(deck.isEmpty(),is(true));
    }

}