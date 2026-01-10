package dk.mathiaskofod.common.dto.player;

import dk.mathiaskofod.common.dto.session.SessionDto;
import dk.mathiaskofod.domain.game.player.Player;
import dk.mathiaskofod.domain.game.player.models.Stats;

public record PlayerDto(String name, String id, Stats stats, SessionDto session) {

    public static PlayerDto create(Player player, SessionDto playerSession){
        return new PlayerDto(
                player.name(),
                player.id(),
                player.stats(),
                playerSession

        );
    }
}
