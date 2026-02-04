package dk.mathiaskofod.domain.game.reports;

import dk.mathiaskofod.domain.game.deck.models.Card;
import dk.mathiaskofod.domain.game.deck.models.Suit;
import dk.mathiaskofod.domain.game.models.Turn;
import dk.mathiaskofod.domain.game.player.Player;
import dk.mathiaskofod.domain.game.player.models.Stats;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.stream.Stream;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.is;

@DisplayName("PlayerEndOfGameReport Tests")
class PlayerReportTest {

    @Nested
    @DisplayName("Single Player Report")
    class SinglePlayer {
        @Test
        @DisplayName("should calculate number of beers correctly (e.g., 54 sips / 10 = 5.4)")
        void shouldCalculateBeersCorrectly() {
            // Arrange
            int sipsInABeer = 10;
            Player player = createPlayerWithStats("p1", sipsInABeer);
            Stream.of(10, 10, 10, 10, 14)
                    .forEach(sips -> player.stats().addTurn(createTurnWithSips(sips)));

            // Act
            List<PlayerReport> reports = PlayerReport.create(List.of(player));

            // Assert
            assertThat(reports.size(), is(1));
            PlayerReport report = reports.getFirst();
            assertThat(report.totalSips(), is(54));
            assertThat(report.nrOfBeers(), is(5.4));
        }

        @Test
        @DisplayName("should handle player with no turns")
        void shouldHandlePlayerWithNoTurns() {
            // Arrange
            Player player = createPlayerWithStats("p1", 10);

            // Act
            List<PlayerReport> reports = PlayerReport.create(List.of(player));

            // Assert
            assertThat(reports.size(), is(1));
            PlayerReport report = reports.getFirst();
            assertThat(report.totalSips(), is(0));
            assertThat(report.avgSips(), is(0.0));
            assertThat(report.nrOfBeers(), is(0.0));
            assertThat(report.totalTime(), is(0L));
            assertThat(report.avgRoundTime(), is(0L));
        }

        @Test
        @DisplayName("should handle sipsInABeer being 0 by returning 0.0 beers")
        void shouldHandleZeroSipsInABeer() {
            // Arrange
            Player player = createPlayerWithStats("p1", 0);
            player.stats().addTurn(createTurnWithSips(10));

            // Act
            List<PlayerReport> reports = PlayerReport.create(List.of(player));

            // Assert
            assertThat(reports.size(), is(1));
            PlayerReport report = reports.getFirst();
            assertThat(report.nrOfBeers(), is(0.0));
        }

        @Test
        @DisplayName("should handle sipsInABeer being negative by returning 0.0 beers")
        void shouldHandleNegativeSipsInABeer() {
            // Arrange
            Player player = createPlayerWithStats("p1", -5);
            player.stats().addTurn(createTurnWithSips(10));

            // Act
            List<PlayerReport> reports = PlayerReport.create(List.of(player));

            // Assert
            assertThat(reports.size(), is(1));
            PlayerReport report = reports.getFirst();
            assertThat(report.nrOfBeers(), is(0.0));
        }
    }

    @Nested
    @DisplayName("Multiple Players Report")
    class MultiplePlayers {
        @Test
        @DisplayName("should calculate stats for multiple players independently")
        void shouldCalculateStatsForMultiplePlayers() {
            // Arrange
            Player p1 = createPlayerWithStats("p1", 10);
            p1.stats().addTurn(createTurnWithSips(4));

            Player p2 = createPlayerWithStats("p2", 10);
            p2.stats().addTurn(createTurnWithSips(8));

            // Act
            List<PlayerReport> reports = PlayerReport.create(List.of(p1, p2));

            // Assert
            assertThat(reports.size(), is(2));
            assertThat(reports.get(0).totalSips(), is(4));
            assertThat(reports.get(1).totalSips(), is(8));
        }
    }

    private Player createPlayerWithStats(String id, int sipsInABeer) {
        return new Player("name", id, sipsInABeer, true, new Stats());
    }

    private Turn createTurnWithSips(int sips) {
        return new Turn(1, new Card(Suit.CIRCLE, sips), 1000);
    }
}