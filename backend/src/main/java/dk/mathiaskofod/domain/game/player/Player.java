package dk.mathiaskofod.domain.game.player;

import dk.mathiaskofod.domain.game.player.models.Stats;
import dk.mathiaskofod.services.game.id.generator.IdGenerator;

public record Player(String name, String id, int sipsInABeer, boolean canDrawChugCard, Stats stats) {

    public static Player create(String name, int sipsInABeer, boolean canDrawChugCard) {
        String id = IdGenerator.generatePlayerId();
        return new Player(name, id, sipsInABeer, canDrawChugCard, new Stats());

    }
}
