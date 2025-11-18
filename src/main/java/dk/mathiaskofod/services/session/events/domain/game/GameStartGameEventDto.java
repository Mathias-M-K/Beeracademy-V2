package dk.mathiaskofod.services.session.events.domain.game;

import dk.mathiaskofod.domain.game.events.StartGameEvent;
import dk.mathiaskofod.domain.game.models.GameId;
import dk.mathiaskofod.services.session.models.annotations.EventType;

@EventType("GAME_START")
public record GameStartGameEventDto(GameId gameId) implements GameEventDto {

    public static GameStartGameEventDto fromGameEvent(StartGameEvent event) {
        return new GameStartGameEventDto(event.gameId());
    }
}
