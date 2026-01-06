package dk.mathiaskofod.services.session.events.client.player;

import com.fasterxml.jackson.annotation.JsonTypeInfo;
import dk.mathiaskofod.api.game.models.GameIdDto;

@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "type")
public interface PlayerClientEvent {

    String playerId();

    String gameId();
}
