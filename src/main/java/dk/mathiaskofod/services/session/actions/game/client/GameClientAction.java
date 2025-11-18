package dk.mathiaskofod.services.session.actions.game.client;

import com.fasterxml.jackson.annotation.JsonTypeInfo;

@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "type")
public interface GameClientAction {
}
