package dk.mathiaskofod.services.session.events.domain.game;

import dk.mathiaskofod.domain.game.events.ResumeGameEvent;
import dk.mathiaskofod.domain.game.models.GameId;
import dk.mathiaskofod.services.session.models.annotations.EventType;

@EventType("GAME_RESUMED")
public record GameResumedGameEventDto(GameId gameId) implements GameEventDto {

    public static GameResumedGameEventDto fromGameEvent(ResumeGameEvent event) {
        return new GameResumedGameEventDto(event.gameId());
    }

}
