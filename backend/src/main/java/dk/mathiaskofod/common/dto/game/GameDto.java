package dk.mathiaskofod.common.dto.game;

import dk.mathiaskofod.common.dto.player.PlayerDto;
import dk.mathiaskofod.common.dto.session.SessionDto;
import dk.mathiaskofod.domain.game.Game;
import dk.mathiaskofod.domain.game.deck.Deck;
import dk.mathiaskofod.domain.game.deck.models.Card;
import dk.mathiaskofod.domain.game.models.GameState;
import dk.mathiaskofod.domain.game.player.Player;
import dk.mathiaskofod.domain.game.timer.TimeReport;
import dk.mathiaskofod.domain.game.timer.TimerReports;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

public record GameDto(
        String name,
        String partyId,
        GameState gameState,
        int currentRound,
        Card lastCard,
        String nextPlayerToDraw,
        String playerToDrawNextAfter,
        String lastPlayerToDraw,
        List<PlayerDto> players,
        List<RankCountDto> remainingCardsCount,
        TimerReports timerReports,
        SessionDto session) {

    public static GameDto create(Game game, SessionDto gameSession, List<PlayerDto> players, Deck deck) {

        String lastPlayerToDraw =
                Optional.ofNullable(game.getLastToDraw()).map(Player::id).orElse("");

        Map<Integer, Integer> remainingByRank = deck.getUnusedCards().stream()
                .collect(Collectors.groupingBy(Card::rank, Collectors.summingInt(card -> 1)));

        List<RankCountDto> remainingCardsCount = deck.getCards().stream()
                .map(Card::rank)
                .distinct()
                .sorted()
                .map(rank -> new RankCountDto(rank, remainingByRank.getOrDefault(rank, 0)))
                .toList();

        return new GameDto(
                game.getName(),
                game.getGameId(),
                game.getGameState(),
                game.getRound(),
                game.getLastCardDrawn(),
                game.getNextToDraw().id(),
                game.getNextAfter().id(),
                lastPlayerToDraw,
                players,
                remainingCardsCount,
                new TimerReports(
                        TimeReport.createReport(game.getGameTimer()), TimeReport.createReport(game.getPlayerTimer())),
                gameSession);
    }
}
