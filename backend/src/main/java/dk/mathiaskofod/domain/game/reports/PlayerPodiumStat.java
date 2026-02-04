package dk.mathiaskofod.domain.game.reports;

public record PlayerPodiumStat(String playerId, double value) implements Comparable<PlayerPodiumStat> {
    @Override
    public int compareTo(PlayerPodiumStat o) {
        return Double.compare(this.value, o.value);
    }
}
