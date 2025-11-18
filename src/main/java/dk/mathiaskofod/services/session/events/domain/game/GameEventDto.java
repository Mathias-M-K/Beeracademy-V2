package dk.mathiaskofod.services.session.events.domain.game;

import com.fasterxml.jackson.annotation.JsonTypeInfo;

@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "type")
public interface GameEventDto {

}
