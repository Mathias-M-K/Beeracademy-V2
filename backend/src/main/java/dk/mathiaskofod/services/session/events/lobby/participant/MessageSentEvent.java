package dk.mathiaskofod.services.session.events.lobby.participant;

import dk.mathiaskofod.services.session.models.annotations.EventType;

@EventType("MESSAGE_SENT")
public record MessageSentEvent(String senderId, String message) implements LobbyParticipantEvent {}
