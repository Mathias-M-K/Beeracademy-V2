package dk.mathiaskofod.domain.game.reports;

public record PlayerPodiumStat(String playerId, double value) implements Comparable<PlayerPodiumStat> {
    /**
     * Compare this PlayerPodiumStat with another by their numeric value to determine ordering.
     *
     * @param o the other PlayerPodiumStat to compare against
     * @return a negative integer if this value is less than the other's value, zero if equal, or a positive integer if greater
     */
    @Override
    public int compareTo(PlayerPodiumStat o) {
        return Double.compare(this.value, o.value);
    }
}