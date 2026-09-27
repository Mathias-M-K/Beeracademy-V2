package dk.mathiaskofod.common.dto.player;

import dk.mathiaskofod.common.dto.session.SessionDto;
import dk.mathiaskofod.domain.game.player.Player;
import dk.mathiaskofod.domain.game.player.models.Stats;
import org.eclipse.microprofile.openapi.annotations.media.Schema;

public record PlayerDto(
        @Schema(required = true)
        String name,

        @Schema(required = true)
        String id,

        @Schema(required = true)
        int sipsInABeer,

        @Schema(required = true)
        boolean canDrawChugCard,

        @Schema(required = true)
        Stats stats,

        @Schema(required = true)
        SessionDto session) {

    public static PlayerDto create(Player player, SessionDto playerSession) {
        return new PlayerDto(
                player.name(),
                player.id(),
                player.sipsInABeer(),
                player.canDrawChugCard(),
                player.stats(),
                playerSession);
    }
}
