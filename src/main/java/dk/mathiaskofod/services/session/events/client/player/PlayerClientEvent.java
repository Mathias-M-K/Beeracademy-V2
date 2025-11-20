package dk.mathiaskofod.services.session.events.client.player;

import com.fasterxml.jackson.annotation.JsonTypeInfo;
import dk.mathiaskofod.domain.game.models.GameId;

@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "type")
public interface PlayerClientEvent {

    String playerId();

    GameId gameId();
}
