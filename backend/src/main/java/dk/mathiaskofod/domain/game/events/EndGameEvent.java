package dk.mathiaskofod.domain.game.events;

import dk.mathiaskofod.domain.game.reports.GameReport;
import dk.mathiaskofod.domain.game.reports.PlayerReport;
import dk.mathiaskofod.domain.game.timer.TimerReports;

import java.util.List;

public record EndGameEvent(String gameId, GameReport gameReport, List<PlayerReport> playerReports, TimerReports timerReports) implements GameEvent{
}
