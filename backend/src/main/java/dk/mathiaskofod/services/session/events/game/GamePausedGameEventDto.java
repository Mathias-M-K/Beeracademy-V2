package dk.mathiaskofod.services.session.events.game;

import dk.mathiaskofod.domain.game.events.PauseGameEvent;
import dk.mathiaskofod.domain.game.timer.models.TimeReport;
import dk.mathiaskofod.services.session.models.annotations.EventType;

@EventType("GAME_PAUSED")
public record GamePausedGameEventDto(TimeReport timeReport) implements GameEventDto {
    public static GamePausedGameEventDto fromGameEvent(PauseGameEvent pauseGameEvent){
        return new GamePausedGameEventDto(pauseGameEvent.timeReport());
    }

}
