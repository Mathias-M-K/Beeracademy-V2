package dk.mathiaskofod.services.session.events.game;

import dk.mathiaskofod.domain.game.events.ResumeGameEvent;
import dk.mathiaskofod.domain.game.timer.TimerReports;
import dk.mathiaskofod.services.session.models.annotations.EventType;

@EventType("GAME_RESUMED")
public record GameResumedGameEventDto(TimerReports timerReports) implements GameEventDto {
    public static GameResumedGameEventDto fromGameEvent(ResumeGameEvent gameEvent) {
        return new GameResumedGameEventDto(gameEvent.timerReports());
    }
}
