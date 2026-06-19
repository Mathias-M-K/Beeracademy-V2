package dk.mathiaskofod.services.session.events.lobby.client;

import dk.mathiaskofod.services.session.models.annotations.EventType;

@EventType("PARTICIPANT_KICKED")
public record ParticipantKickedEvent(String participantId, String kickReason) implements LobbyClientEvent {}
