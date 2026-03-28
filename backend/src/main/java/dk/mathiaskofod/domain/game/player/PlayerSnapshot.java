package dk.mathiaskofod.domain.game.player;

import dk.mathiaskofod.domain.game.player.models.Stats;

public record PlayerSnapshot(
        String name,
        String id,
        int sipsInABeer,
        boolean canDrawChugCard,
        Stats stats
) {

}
