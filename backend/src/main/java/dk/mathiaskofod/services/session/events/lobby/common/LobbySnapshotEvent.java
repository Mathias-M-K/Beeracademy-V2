package dk.mathiaskofod.services.session.events.lobby.common;

import dk.mathiaskofod.api.lobby.models.dto.LobbyDTO;
import dk.mathiaskofod.services.session.events.lobby.client.LobbyClientEvent;
import dk.mathiaskofod.services.session.events.lobby.participant.LobbyParticipantEvent;
import dk.mathiaskofod.services.session.models.annotations.EventType;

/**
 * Event fired when a device joins, and in turn received the current lobby state
 *
 * @param lobby lobby state
 */
@EventType("HELLO_LOBBY_SNAPSHOT")
public record LobbySnapshotEvent(LobbyDTO lobby) implements LobbyParticipantEvent, LobbyClientEvent {}
