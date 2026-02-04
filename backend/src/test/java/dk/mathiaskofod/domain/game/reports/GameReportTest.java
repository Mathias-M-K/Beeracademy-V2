package dk.mathiaskofod.domain.game.reports;

import dk.mathiaskofod.domain.game.deck.models.Card;
import dk.mathiaskofod.domain.game.deck.models.Suit;
import dk.mathiaskofod.domain.game.models.Chug;
import dk.mathiaskofod.domain.game.models.Turn;
import dk.mathiaskofod.domain.game.player.Player;
import dk.mathiaskofod.domain.game.player.models.Stats;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.util.Collections;
import java.util.List;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.empty;
import static org.hamcrest.Matchers.is;

@DisplayName("GameReport Tests")
class GameReportTest {
    private static final String PLAYER_1_ID = "p1";
    private static final String PLAYER_2_ID = "p2";

    @Nested
    @DisplayName("Empty Report")
    class Empty {
        @Test
        @DisplayName("should create empty report when no players")
        void shouldCreateEmptyReportWhenNoPlayers() {
            // Arrange
            List<Player> players = Collections.emptyList();

            // Act
            GameReport report = GameReport.create(players);

            // Assert
            assertThat(report.chugTimes(), is(empty()));
            assertThat(report.beersConsumed(), is(empty()));
            assertThat(report.avgRoundTimes(), is(empty()));
        }
    }

    @Nested
    @DisplayName("Chug Times")
    class ChugTimes {

        @Test
        @DisplayName("should calculate and sort chug times from multiple players")
        void shouldCalculateAndSortChugTimes() {
            // Arrange
            double p1Chug1 = 5000.0;
            double p1Chug2 = 3000.0;
            double p2Chug1 = 4000.0;

            Player p1 = createPlayerWithStats(PLAYER_1_ID);
            p1.stats().addChug(new Chug(Suit.CIRCLE, (long) p1Chug1));
            p1.stats().addChug(new Chug(Suit.HEART, (long) p1Chug2));

            Player p2 = createPlayerWithStats(PLAYER_2_ID);
            p2.stats().addChug(new Chug(Suit.SQUARE, (long) p2Chug1));

            List<Player> players = List.of(p1, p2);

            // Act
            GameReport report = GameReport.create(players);

            // Assert
            assertThat(report.chugTimes().size(), is(3));
            assertThat(report.chugTimes().get(0).playerId(), is(PLAYER_1_ID));
            assertThat(report.chugTimes().get(0).value(), is(p1Chug2));
            assertThat(report.chugTimes().get(1).playerId(), is(PLAYER_2_ID));
            assertThat(report.chugTimes().get(1).value(), is(p2Chug1));
            assertThat(report.chugTimes().get(2).playerId(), is(PLAYER_1_ID));
            assertThat(report.chugTimes().get(2).value(), is(p1Chug1));
        }
    }

    @Nested
    @DisplayName("Beers Consumed")
    class BeersConsumed {
        @Test
        @DisplayName("should calculate total beers consumed for each player")
        void shouldCalculateBeersConsumed() {
            // Arrange
            int p1Sips1 = 5;
            int p1Sips2 = 3;
            int p2Sips1 = 10;
            Player p1 = createPlayerWithStats(PLAYER_1_ID, 10); // 10 sips per beer
            p1.stats().addTurn(new Turn(1, new Card(Suit.CIRCLE, p1Sips1), 1000));
            p1.stats().addTurn(new Turn(2, new Card(Suit.HEART, p1Sips2), 1000)); // Total 8 sips = 0.8 beers

            Player p2 = createPlayerWithStats(PLAYER_2_ID, 10);
            p2.stats().addTurn(new Turn(1, new Card(Suit.SQUARE, p2Sips1), 1000)); // Total 10 sips = 1.0 beers

            List<Player> players = List.of(p1, p2);

            // Act
            GameReport report = GameReport.create(players);

            // Assert
            assertThat(report.beersConsumed().size(), is(2));
            // Sorted by value (descending)
            assertThat(report.beersConsumed().get(0).playerId(), is(PLAYER_2_ID));
            assertThat(report.beersConsumed().get(0).value(), is(1.0));
            assertThat(report.beersConsumed().get(1).playerId(), is(PLAYER_1_ID));
            assertThat(report.beersConsumed().get(1).value(), is(0.8));
        }
    }

    @Nested
    @DisplayName("Average Round Times")
    class AverageRoundTimes {
        @Test
        @DisplayName("should calculate and sort average round times")
        void shouldCalculateAndSortAvgRoundTimes() {
            // Arrange
            double p1Time1 = 2000.0;
            double p1Time2 = 4000.0; // Avg 3000.0
            double p2Time1 = 1000.0;
            double p2Time2 = 2000.0; // Avg 1500.0

            Player p1 = createPlayerWithStats(PLAYER_1_ID);
            p1.stats().addTurn(new Turn(1, new Card(Suit.CIRCLE, 2), (long) p1Time1));
            p1.stats().addTurn(new Turn(2, new Card(Suit.HEART, 2), (long) p1Time2));

            Player p2 = createPlayerWithStats(PLAYER_2_ID);
            p2.stats().addTurn(new Turn(1, new Card(Suit.SQUARE, 2), (long) p2Time1));
            p2.stats().addTurn(new Turn(2, new Card(Suit.TRIANGLE, 2), (long) p2Time2));

            List<Player> players = List.of(p1, p2);

            // Act
            GameReport report = GameReport.create(players);

            // Assert
            assertThat(report.avgRoundTimes().size(), is(2));
            assertThat(report.avgRoundTimes().get(0).playerId(), is(PLAYER_2_ID));
            assertThat(report.avgRoundTimes().get(0).value(), is(1500.0));
            assertThat(report.avgRoundTimes().get(1).playerId(), is(PLAYER_1_ID));
            assertThat(report.avgRoundTimes().get(1).value(), is(3000.0));
        }
    }

    private Player createPlayerWithStats(String id) {
        return createPlayerWithStats(id, 10);
    }

    private Player createPlayerWithStats(String id, int sipsInABeer) {
        return new Player("name", id, sipsInABeer, true, new Stats());
    }
}