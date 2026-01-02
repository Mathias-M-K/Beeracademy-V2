package dk.mathiaskofod.api.game.models;

import dk.mathiaskofod.domain.game.player.Player;
import dk.mathiaskofod.services.session.player.PlayerSession;

public record PlayerDto(String name, String id, boolean isClaimed, boolean isConnected) {

    public static PlayerDto create(Player player){
        return create(player, null);
    }

    public static PlayerDto create(Player player, PlayerSession playerSession){
        return new PlayerDto(
                player.name(),
                player.id(),
                playerSession != null,
                playerSession != null && playerSession.isConnected()

        );
    }
}
