package dk.mathiaskofod.domain.game.player;

import dk.mathiaskofod.services.game.id.generator.IdGenerator;
import dk.mathiaskofod.domain.game.player.models.Stats;

public record Player(String name, String id, Stats stats) {

    public static Player create(String name){
        String id = IdGenerator.generatePlayerId();
        return new Player(name, id, new Stats());

    }
}
