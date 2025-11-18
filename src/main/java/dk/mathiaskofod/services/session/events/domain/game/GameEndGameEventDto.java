package dk.mathiaskofod.services.session.events.domain.game;

import dk.mathiaskofod.domain.game.events.EndGameEvent;
import dk.mathiaskofod.domain.game.models.GameId;
import dk.mathiaskofod.services.session.models.annotations.EventType;

@EventType("GAME_END")
public record GameEndGameEventDto(GameId gameId) implements GameEventDto {

    public static GameEndGameEventDto fromGameEvent(EndGameEvent event) {
        return new GameEndGameEventDto(event.gameId());
    }
}
