package dk.mathiaskofod.services.session.models.events.game;

import dk.mathiaskofod.domain.game.events.events.ResumeGameEvent;
import dk.mathiaskofod.services.game.id.generator.models.GameId;
import dk.mathiaskofod.services.session.annotations.EventType;

@EventType("GAME_RESUMED")
public record GameResumedGameEventDto(GameId gameId) implements GameEventDto {

    public static GameResumedGameEventDto fromGameEvent(ResumeGameEvent event) {
        return new GameResumedGameEventDto(event.gameId());
    }

}
