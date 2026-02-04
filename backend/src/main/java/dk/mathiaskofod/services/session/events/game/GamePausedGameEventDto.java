package dk.mathiaskofod.services.session.events.game;

import dk.mathiaskofod.domain.game.events.PauseGameEvent;
import dk.mathiaskofod.domain.game.timer.TimerReports;
import dk.mathiaskofod.services.session.models.annotations.EventType;

@EventType("GAME_PAUSED")
public record GamePausedGameEventDto(TimerReports timerReports) implements GameEventDto {
    public static GamePausedGameEventDto fromGameEvent(PauseGameEvent pauseGameEvent){
        return new GamePausedGameEventDto(pauseGameEvent.timerReports());
    }
}
