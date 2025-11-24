package dk.mathiaskofod.services.session.events.domain.game;

import dk.mathiaskofod.services.session.models.annotations.EventType;

@EventType("GAME_PAUSED")
public record GamePausedGameEventDto() implements GameEventDto {

}
