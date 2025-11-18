package dk.mathiaskofod.services.session.events.domain.game;

import dk.mathiaskofod.domain.game.events.PauseGameEvent;
import dk.mathiaskofod.domain.game.models.GameId;
import dk.mathiaskofod.services.session.models.annotations.EventType;

@EventType("GAME_PAUSED")
public record GamePausedGameEventDto(GameId gameId) implements GameEventDto {

    public static GamePausedGameEventDto fromGameEvent(PauseGameEvent event) {
        return new GamePausedGameEventDto(event.gameId());
    }
}
