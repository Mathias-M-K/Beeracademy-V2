package dk.mathiaskofod.services.session.events.lobby.participant;

import dk.mathiaskofod.services.lobby.models.LobbyParticipant;
import dk.mathiaskofod.services.session.models.annotations.EventType;

@EventType("PARTICIPANT_CONNECTED")
public record LobbyParticipantConnectedEvent(LobbyParticipant participant) implements LobbyParticipantEvent {}
