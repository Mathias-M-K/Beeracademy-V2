package dk.mathiaskofod.services.session.events.game.game;

import dk.mathiaskofod.domain.game.events.EndGameEvent;

import dk.mathiaskofod.domain.game.timer.TimerReports;
import dk.mathiaskofod.services.session.models.annotations.EventType;

@EventType("GAME_END")
public record GameEndEventDto(TimerReports timeReports) implements GameEventDto {
    public static GameEndEventDto fromGameEvent(EndGameEvent event) {
        return new GameEndEventDto(event.timerReports());
    }
}
