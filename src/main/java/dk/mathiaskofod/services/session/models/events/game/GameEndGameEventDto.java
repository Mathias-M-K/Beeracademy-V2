package dk.mathiaskofod.services.session.models.events.game;

import dk.mathiaskofod.domain.game.events.events.EndGameEvent;
import dk.mathiaskofod.services.game.id.generator.models.GameId;
import dk.mathiaskofod.services.session.annotations.EventType;

@EventType("GAME_END")
public record GameEndGameEventDto(GameId gameId) implements GameEventDto {

    public static GameEndGameEventDto fromGameEvent(EndGameEvent event) {
        return new GameEndGameEventDto(event.gameId());
    }
}
