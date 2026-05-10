package dk.mathiaskofod.domain.game.deck;

import dk.mathiaskofod.domain.game.deck.models.Card;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.*;


class DeckSnapshotTest {

    @Nested
    @DisplayName("Unused cards are correctly captured in snapshot")
    class UnusedCardsAreCorrectlyCapturedInSnapshot {

        Deck deck;

        @BeforeEach
        void init(){
            deck = new Deck(4); // Standard deck with 4 suits
        }

        @Test
        @DisplayName("Snapshot should capture all unused cards for new deck")
        void snapshotShouldCaptureAllUnusedCardsForNewDeck(){

            //Arrange
            DeckSnapshot snapshot = DeckSnapshot.of(deck);

            //Assert
            assertThat(snapshot.unusedCards(), hasSize(52));
        }

        @Test
        @DisplayName("Snapshot should capture reduced unused cards after draws")
        void snapshotShouldCaptureReducedUnusedCardsAfterDraws(){

            //Arrange
            deck.drawCard();
            deck.drawCard();
            deck.drawCard();

            //Act
            DeckSnapshot snapshot = DeckSnapshot.of(deck);

            //Assert
            assertThat(snapshot.unusedCards(), hasSize(49));
        }
    }

    @Nested
    @DisplayName("Used cards are correctly captured in snapshot")
    class UsedCardsAreCorrectlyCapturedInSnapshot {

        Deck deck;

        @BeforeEach
        void init(){
            deck = new Deck(4); // Standard deck with 4 suits
        }

        @Test
        @DisplayName("Snapshot should capture empty used cards for new deck")
        void snapshotShouldCaptureEmptyUsedCardsForNewDeck(){

            //Act
            DeckSnapshot snapshot = DeckSnapshot.of(deck);

            //Assert
            assertThat(snapshot.usedCards(), is(empty()));
        }

        @Test
        @DisplayName("Snapshot should capture used cards after draws")
        void snapshotShouldCaptureUsedCardsAfterDraws(){

            //Arrange
            deck.drawCard();
            deck.drawCard();

            //Act
            DeckSnapshot snapshot = DeckSnapshot.of(deck);

            //Assert
            assertThat(snapshot.usedCards(), hasSize(2));
        }
    }

    @Nested
    @DisplayName("Snapshot immutability")
    class SnapshotImmutability {

        Deck deck;

        @BeforeEach
        void init(){
            deck = new Deck(4); // Standard deck with 4 suits
        }

        @Test
        @DisplayName("Snapshot should not affect original deck state")
        void snapshotShouldNotAffectOriginalDeckState(){

            //Arrange
            DeckSnapshot snapshot1 = DeckSnapshot.of(deck);

            //Act
            DeckSnapshot snapshot2 = DeckSnapshot.of(deck);

            //Assert
            assertThat(snapshot1.unusedCards(), hasSize(52));
            assertThat(snapshot2.unusedCards(), hasSize(51));
            assertThat(snapshot1.usedCards(), is(empty()));
            assertThat(snapshot2.usedCards(), hasSize(1));
        }

        @Test
        @DisplayName("Multiple snapshots should capture different states")
        void multipleSnapshotsShouldCaptureDifferentStates(){

            //Arrange
            DeckSnapshot snapshot1 = DeckSnapshot.of(deck);
            deck.drawCard();
            DeckSnapshot snapshot2 = DeckSnapshot.of(deck);
            deck.drawCard();
            DeckSnapshot snapshot3 = DeckSnapshot.of(deck);

            //Assert
            assertThat(snapshot1.unusedCards(), hasSize(52));
            assertThat(snapshot2.unusedCards(), hasSize(51));
            assertThat(snapshot3.unusedCards(), hasSize(50));
        }
    }

    @Nested
    @DisplayName("Snapshot captures specific card values")
    class SnapshotCapturesSpecificCardValues {

        Deck deck;

        @BeforeEach
        void init(){
            deck = new Deck(4); // Standard deck with 4 suits
        }

        @Test
        @DisplayName("Snapshot should capture specific unused card values")
        void snapshotShouldCaptureSpecificUnusedCardValues(){

            //Arrange
            Card card = deck.drawCard();

            //Act
            DeckSnapshot snapshot = DeckSnapshot.of(deck);

            //Assert
            assertThat(snapshot.unusedCards(), hasSize(51));
            assertThat(snapshot.usedCards(), hasSize(1));
            assertThat(snapshot.usedCards().getFirst(), is(card));
        }
    }
}
