package dk.mathiaskofod.services.session.events.lobby.client;

import com.fasterxml.jackson.annotation.JsonTypeInfo;

@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "type")
public interface LobbyClientEvent {
}
