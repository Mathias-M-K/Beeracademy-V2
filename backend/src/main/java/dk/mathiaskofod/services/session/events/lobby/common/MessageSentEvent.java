package dk.mathiaskofod.services.session.events.lobby.common;

import dk.mathiaskofod.services.session.events.lobby.client.LobbyClientEvent;
import dk.mathiaskofod.services.session.events.lobby.participant.LobbyParticipantEvent;
import dk.mathiaskofod.services.session.models.annotations.EventType;

@EventType("MESSAGE_SENT")
public record MessageSentEvent(String senderId, String message) implements LobbyParticipantEvent, LobbyClientEvent {}
