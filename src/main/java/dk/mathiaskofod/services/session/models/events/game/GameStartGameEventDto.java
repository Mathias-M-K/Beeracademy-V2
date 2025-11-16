package dk.mathiaskofod.services.session.models.events.game;

import dk.mathiaskofod.domain.game.events.events.StartGameEvent;
import dk.mathiaskofod.services.game.id.generator.models.GameId;

public record GameStartGameEventDto(GameId gameId) implements GameEventDto {

    public static GameStartGameEventDto fromGameEvent(StartGameEvent event) {
        return new GameStartGameEventDto(event.gameId());
    }

    @Override
    public GameEventType getType() {
        return GameEventType.GAME_START;
    }
}
