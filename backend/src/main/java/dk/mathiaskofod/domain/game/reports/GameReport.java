package dk.mathiaskofod.domain.game.reports;

import dk.mathiaskofod.domain.game.models.Turn;
import dk.mathiaskofod.domain.game.player.Player;

import java.util.List;

public record GameReport(List<PlayerPodiumStat> chugTimes, List<PlayerPodiumStat> beersConsumed, List<PlayerPodiumStat> avgRoundTimes) {

    public static GameReport create(List<Player> players) {
        
        List<PlayerPodiumStat> chugTimes = players.stream()
                .flatMap(player -> player.stats().getChugs().stream()
                        .map(chug -> new PlayerPodiumStat(player.id(), chug.chugTimeMillis())))
                .sorted()
                .toList();

        List<PlayerPodiumStat> beersConsumed = players.stream()
                .map(player -> {
                    double totalBeers = player.stats().getTurns().stream()
                            .mapToDouble(turn -> turn.card().rank())
                            .sum() / player.sipsInABeer();
                    return new PlayerPodiumStat(player.id(), totalBeers);
                })
                .sorted()
                .toList();


        List<PlayerPodiumStat> avgRoundTimes = players.stream()
                .map(player -> {
                    double avgRoundTime = player.stats().getTurns().stream()
                            .mapToLong(Turn::durationInMillis)
                            .average()
                            .orElse(0.0);

                    return new PlayerPodiumStat(player.id(), avgRoundTime);
                })
                .sorted()
                .toList();


        return new GameReport(chugTimes, beersConsumed, avgRoundTimes);
    }
}
