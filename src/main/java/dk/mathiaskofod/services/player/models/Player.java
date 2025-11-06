package dk.mathiaskofod.services.player.models;

import dk.mathiaskofod.services.game.models.Stats;

public record Player(String name, Stats stats, ConnectionInfo connectionInfo) {

    public static Player create(String name){
        return new Player(name,Stats.create(), new ConnectionInfo());

    }
}
