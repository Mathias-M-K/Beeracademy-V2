package dk.mathiaskofod.services.session.events.game.dto;

import com.fasterxml.jackson.annotation.JsonTypeInfo;


@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "type")
public interface GameEventDto {

}
