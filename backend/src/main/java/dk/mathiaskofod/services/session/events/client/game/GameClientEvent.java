package dk.mathiaskofod.services.session.events.client.game;

import com.fasterxml.jackson.annotation.JsonTypeInfo;

@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "type")
public interface GameClientEvent {
}
