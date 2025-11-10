package dk.mathiaskofod.services.game;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class DeckTest {

    @Test
    @DisplayName("Deck can consist of 12 suits")
    void deckCanConsistOfTwelveSuits(){

        //Arrange
        Deck deck = new Deck(12);

        //Assert
        System.out.println(deck.cards);
    }

}