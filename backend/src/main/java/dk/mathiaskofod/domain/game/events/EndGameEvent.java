package dk.mathiaskofod.domain.game.events;

import dk.mathiaskofod.domain.game.reports.GameReport;
import dk.mathiaskofod.domain.game.reports.PlayerReport;
import dk.mathiaskofod.domain.game.timer.models.TimeReport;

import java.util.List;

public record EndGameEvent(String gameId, GameReport gameReport, List<PlayerReport> playerReports, TimeReport timeReport) implements GameEvent{
}
