package dk.mathiaskofod.common.dto.player;

import dk.mathiaskofod.domain.game.player.Player;
import dk.mathiaskofod.services.session.models.Session;

public record PlayerDto(String name, String id, boolean isClaimed, boolean isConnected) {

    public static PlayerDto create(Player player){
        return create(player, null);
    }

    public static PlayerDto create(Player player, Session playerSession){
        return new PlayerDto(
                player.name(),
                player.id(),
                playerSession != null,
                playerSession != null && playerSession.isConnected()

        );
    }
}
