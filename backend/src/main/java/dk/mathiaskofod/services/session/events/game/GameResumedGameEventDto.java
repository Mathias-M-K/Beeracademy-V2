package dk.mathiaskofod.services.session.events.game;

import dk.mathiaskofod.domain.game.events.ResumeGameEvent;
import dk.mathiaskofod.domain.game.timer.models.TimeReport;
import dk.mathiaskofod.services.session.models.annotations.EventType;

@EventType("GAME_RESUMED")
public record GameResumedGameEventDto(TimeReport timeReport) implements GameEventDto {
    public static GameResumedGameEventDto fromGameEvent(ResumeGameEvent gameEvent) {
        return new GameResumedGameEventDto(gameEvent.timeReport());
    }


}
