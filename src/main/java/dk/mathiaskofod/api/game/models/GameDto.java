package dk.mathiaskofod.api.game.models;

import dk.mathiaskofod.domain.game.Game;
import dk.mathiaskofod.services.session.events.game.dto.GameSession;

import java.util.List;

public record GameDto(String name, String id, boolean isClaimed, boolean isConnected,  List<PlayerDto> players) {

    public static GameDto create(Game game, List<PlayerDto> players) {
        return create(game, null, players);
    }

    public static GameDto create(Game game, GameSession gameSession, List<PlayerDto> players) {

        return new GameDto(
                game.getName(),
                game.getGameId().humanReadableId(),
                gameSession != null,
                gameSession != null && gameSession.isConnected(),
                players
        );
    }
}
