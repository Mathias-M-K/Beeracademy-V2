package dk.mathiaskofod.services.session.events.lobby.participant;

import dk.mathiaskofod.services.lobby.models.LobbyParticipant;

public record LobbyParticipantConnectedEvent(LobbyParticipant participant) implements LobbyParticipantEvent {}
