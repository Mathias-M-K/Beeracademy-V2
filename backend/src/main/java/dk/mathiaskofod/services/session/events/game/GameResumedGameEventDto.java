package dk.mathiaskofod.services.session.events.game;

import dk.mathiaskofod.services.session.models.annotations.EventType;

@EventType("GAME_RESUMED")
public record GameResumedGameEventDto() implements GameEventDto {


}
