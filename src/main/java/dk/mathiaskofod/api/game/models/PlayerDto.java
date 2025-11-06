package dk.mathiaskofod.api.game.models;

import dk.mathiaskofod.services.player.models.Player;

public record PlayerDto(String name, String id) {

    public static PlayerDto fromPlayer(Player player){
        return new PlayerDto(
                player.name(),
                player.id()
        );
    }
}
