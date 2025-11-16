package dk.mathiaskofod.services.session.models.events.game;

import dk.mathiaskofod.domain.game.events.events.PauseGameEvent;
import dk.mathiaskofod.services.game.id.generator.models.GameId;

public record GamePausedGameEventDto(GameId gameId) implements GameEventDto {

    public static GamePausedGameEventDto fromGameEvent(PauseGameEvent event) {
        return new GamePausedGameEventDto(event.gameId());
    }

    @Override
    public GameEventType getType() {
        return GameEventType.GAME_PAUSED;
    }
}
