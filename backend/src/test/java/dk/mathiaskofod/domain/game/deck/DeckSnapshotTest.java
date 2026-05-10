package dk.mathiaskofod.domain.game.deck;

import dk.mathiaskofod.domain.game.deck.models.Card;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;


class DeckSnapshotTest {

    @Test
    @DisplayName("Unused cards are preserved in snapshot")
    void unusedCardsArePreservedInSnapshot() {

        //Arrange
        Deck deck = new Deck(1);

        //Act
        DeckSnapshot snapshot = DeckSnapshot.of(deck);

        //Assert
        assertThat(snapshot.unusedCards(), hasSize(13));
        assertThat(deck.unusedCards, hasSize(13));
    }

    @Test
    @DisplayName("Used cards are preserved in snapshot")
    void usedCardsArePreservedInSnapshot() {

        //Arrange
        Deck deck = new Deck(1);

        //Act
        Card drawnCard = deck.drawCard();
        DeckSnapshot snapshot = DeckSnapshot.of(deck);

        //Assert
        assertThat(snapshot.unusedCards(), hasSize(12));
        assertThat(snapshot.usedCards(), hasSize(1));

        assertThat(deck.unusedCards, hasSize(12));
        assertThat(deck.usedCards, hasSize(1));

        assertThat(snapshot.usedCards().getFirst(), is(drawnCard));
    }
}
