package dk.mathiaskofod.services.session.events.lobby.client;

import dk.mathiaskofod.services.session.actions.lobby.client.KickPlayerAction;
import dk.mathiaskofod.services.session.models.annotations.EventType;

@EventType("PLAYER_KICKED")
public record PlayerKickedEvent(String playerId, String kickReason) implements LobbyClientEvent {

    public static PlayerKickedEvent fromPlayerKickedAction(KickPlayerAction kickPlayerAction) {
        return new PlayerKickedEvent(kickPlayerAction.playerId(), kickPlayerAction.kickReason());
    }
}
