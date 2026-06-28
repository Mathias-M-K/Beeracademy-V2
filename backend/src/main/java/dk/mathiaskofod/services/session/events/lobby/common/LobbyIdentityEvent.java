package dk.mathiaskofod.services.session.events.lobby.common;

import dk.mathiaskofod.services.auth.models.Role;
import dk.mathiaskofod.services.session.events.lobby.client.LobbyClientEvent;
import dk.mathiaskofod.services.session.events.lobby.participant.LobbyParticipantEvent;
import dk.mathiaskofod.services.session.models.annotations.EventType;

@EventType("HELLO_LOBBY_IDENTITY")
public record LobbyIdentityEvent(Role role, String id) implements LobbyParticipantEvent, LobbyClientEvent {
}
