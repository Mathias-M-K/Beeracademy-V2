package dk.mathiaskofod.services.player.models;

import dk.mathiaskofod.services.game.game.id.generator.IdGenerator;
import dk.mathiaskofod.services.game.models.Stats;

public record Player(String name, String id, Stats stats, ConnectionInfo connectionInfo) {

    public static Player create(String name){
        String id = IdGenerator.generatePlayerId();
        return new Player(name, id, new Stats(), new ConnectionInfo());

    }
}
