package dk.mathiaskofod.services.session.events.game;

import dk.mathiaskofod.services.session.models.annotations.EventType;

@EventType("GAME_PAUSED")
public record GamePausedGameEventDto() implements GameEventDto {

}
