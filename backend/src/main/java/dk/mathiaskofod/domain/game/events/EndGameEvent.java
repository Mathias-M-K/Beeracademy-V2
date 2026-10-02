package dk.mathiaskofod.domain.game.events;

import dk.mathiaskofod.domain.game.timer.TimerReports;

public record EndGameEvent(String gameId, TimerReports timerReports) implements GameEvent {}
