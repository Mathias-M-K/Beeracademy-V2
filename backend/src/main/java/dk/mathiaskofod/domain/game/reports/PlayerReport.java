package dk.mathiaskofod.domain.game.reports;

import dk.mathiaskofod.domain.game.models.Turn;
import dk.mathiaskofod.domain.game.player.Player;

import java.util.List;

public record PlayerReport(int totalSips, double avgSips, double nrOfBeers, long totalTime, long avgRoundTime) {

    public static List<PlayerReport> create(List<Player> players) {
        return players.stream()
                .map(player -> {
                    int totalSips = player.stats().getTurns().stream()
                            .mapToInt(turn -> turn.card().rank())
                            .sum();

                    double avgSips = player.stats().getTurns().stream()
                            .mapToInt(turn -> turn.card().rank())
                            .average()
                            .orElse(0.0);

                    double nrOfBeers = (double) totalSips / player.sipsInABeer();

                    long totalTime = player.stats().getTurns().stream()
                            .mapToLong(Turn::durationInMillis)
                            .sum();

                    long avgRoundTime = (long) player.stats().getTurns().stream()
                            .mapToLong(Turn::durationInMillis)
                            .average()
                            .orElse(0.0);

                    return new PlayerReport(totalSips, avgSips, nrOfBeers, totalTime, avgRoundTime);
                })
                .toList();
    }
}
