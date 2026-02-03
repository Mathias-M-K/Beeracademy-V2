package dk.mathiaskofod.common.dto.game;

import dk.mathiaskofod.common.dto.player.PlayerDto;
import dk.mathiaskofod.common.dto.session.SessionDto;
import dk.mathiaskofod.domain.game.Game;
import dk.mathiaskofod.domain.game.deck.models.Card;
import dk.mathiaskofod.domain.game.models.GameState;
import dk.mathiaskofod.domain.game.timer.TimeReport;
import dk.mathiaskofod.domain.game.timer.TimerReports;

import java.util.List;

public record GameDto(
        String name,
        String id,
        GameState gameState,
        Card lastCard,
        String currentPlayerId,
        String nextPlayerId,
        String previousPlayerId,
        List<PlayerDto> players,
        TimerReports timerReports,
        SessionDto session) {

    public static GameDto create(Game game, SessionDto gameSession, List<PlayerDto> players) {

        String previousPlayerId = game.getPreviousPlayer() == null ? "" : game.getPreviousPlayer().id();

        return new GameDto(
                game.getName(),
                game.getGameId(),
                game.getGameState(),
                game.getLastCard(),
                game.getCurrentPlayer().id(),
                game.getNextPlayer().id(),
                previousPlayerId,
                players,
                new TimerReports(
                        TimeReport.createReport(game.getGameTimer()),
                        TimeReport.createReport(game.getPlayerTimer())
                ),
                gameSession
        );
    }
}
