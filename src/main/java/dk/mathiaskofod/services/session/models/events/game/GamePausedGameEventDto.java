package dk.mathiaskofod.services.session.models.events.game;

import dk.mathiaskofod.domain.game.events.events.PauseGameEvent;
import dk.mathiaskofod.services.game.id.generator.models.GameId;
import dk.mathiaskofod.services.session.annotations.EventType;

@EventType("GAME_PAUSED")
public record GamePausedGameEventDto(GameId gameId) implements GameEventDto {

    public static GamePausedGameEventDto fromGameEvent(PauseGameEvent event) {
        return new GamePausedGameEventDto(event.gameId());
    }
}
