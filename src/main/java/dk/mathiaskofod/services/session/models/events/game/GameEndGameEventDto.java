package dk.mathiaskofod.services.session.models.events.game;

import dk.mathiaskofod.domain.game.events.events.EndGameEvent;
import dk.mathiaskofod.services.game.id.generator.models.GameId;

public record GameEndGameEventDto(GameId gameId) implements GameEventDto {

    public static GameEndGameEventDto fromGameEvent(EndGameEvent event) {
        return new GameEndGameEventDto(event.gameId());
    }

    @Override
    public GameEventType getType() {
        return GameEventType.GAME_END;
    }
}
