package dk.mathiaskofod.services.session.events.lobby.client;

import dk.mathiaskofod.services.session.models.annotations.EventType;

@EventType("PARTICIPANT_REMOVED")
public record ParticipantRemovedEvent(String participantId) implements LobbyClientEvent {}
