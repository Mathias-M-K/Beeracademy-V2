package dk.mathiaskofod.common.dto.game;

import dk.mathiaskofod.common.dto.player.PlayerDto;
import dk.mathiaskofod.common.dto.session.SessionDto;
import dk.mathiaskofod.domain.game.Game;
import dk.mathiaskofod.domain.game.deck.models.Card;
import dk.mathiaskofod.domain.game.timer.models.TimeReport;

import java.util.List;

//TODO remove this if not used
public record GameDto(
        String name,
        String id,
        Card lastCard,
        String currentPlayerId,
        String nextPlayerId,
        String previousPlayerId,
        List<PlayerDto> players,
        TimeReport timeReport,
        SessionDto session) {

    public static GameDto create(Game game, SessionDto gameSession, List<PlayerDto> players) {

        String previousPlayerId = game.getPreviousPlayer() == null ? "" : game.getPreviousPlayer().id();

        return new GameDto(
                game.getName(),
                game.getGameId(),
                game.getLastCard(),
                game.getCurrentPlayer().id(),
                game.getNextPlayer().id(),
                previousPlayerId,
                players,
                game.getTimeReport(),
                gameSession
        );
    }
}
