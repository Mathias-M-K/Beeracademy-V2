package dk.mathiaskofod.common.dto.game;

import dk.mathiaskofod.common.dto.player.PlayerDto;
import dk.mathiaskofod.common.dto.session.SessionDto;
import dk.mathiaskofod.domain.game.Game;

import java.util.List;

//TODO remove this if not used
public record GameDto(
        String name,
        String id,
        String currentPlayerId,
        String nextPlayerId,
        String previousPlayerId,
        SessionDto session,
        List<PlayerDto> players) {

    public static GameDto create(Game game, SessionDto gameSession, List<PlayerDto> players) {

        String previousPlayerId = game.getPreviousPlayer() == null ? "" : game.getPreviousPlayer().id();

        return new GameDto(
                game.getName(),
                game.getGameId(),
                game.getCurrentPlayer().id(),
                game.getNextPlayer().id(),
                previousPlayerId,
                gameSession,
                players
        );
    }
}
