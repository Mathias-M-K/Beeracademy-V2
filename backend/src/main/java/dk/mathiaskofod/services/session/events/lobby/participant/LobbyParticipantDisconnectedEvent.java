package dk.mathiaskofod.services.session.events.lobby.participant;

import dk.mathiaskofod.services.session.models.annotations.EventType;

@EventType("PARTICIPANT_DISCONNECTED")
public record LobbyParticipantDisconnectedEvent(String participantId) implements LobbyParticipantEvent {}
