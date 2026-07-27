package dk.mathiaskofod.services.session.events.common;

import dk.mathiaskofod.services.auth.models.Role;
import dk.mathiaskofod.services.session.events.game.gameclient.GameClientEvent;
import dk.mathiaskofod.services.session.events.game.playerclient.PlayerClientEvent;
import dk.mathiaskofod.services.session.events.lobby.client.LobbyClientEvent;
import dk.mathiaskofod.services.session.events.lobby.participant.LobbyParticipantEvent;
import dk.mathiaskofod.services.session.models.annotations.EventType;

@EventType("HELLO_IDENTITY")
public record IdentityEvent(Role role, String id)
        implements LobbyParticipantEvent, LobbyClientEvent, GameClientEvent, PlayerClientEvent {}
