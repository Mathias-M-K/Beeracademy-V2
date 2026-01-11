package dk.mathiaskofod.services.session.events.game;

import dk.mathiaskofod.domain.game.events.EndGameEvent;
import dk.mathiaskofod.domain.game.timer.models.TimeReport;
import dk.mathiaskofod.services.session.models.annotations.EventType;

@EventType("GAME_END")
public record GameEndGameEventDto(TimeReport timeReport) implements GameEventDto {
    public static GameEndGameEventDto fromGameEvent(EndGameEvent event){
        return new GameEndGameEventDto(event.timeReport());
    }
}
