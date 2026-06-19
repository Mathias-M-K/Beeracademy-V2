package dk.mathiaskofod.services.session.events.lobby.participant;

import dk.mathiaskofod.services.lobby.models.LobbyParticipant;
import dk.mathiaskofod.services.session.events.lobby.client.LobbyClientEvent;
import dk.mathiaskofod.services.session.models.annotations.EventType;

@EventType("NEW_PARTICIPANT")
public record NewParticipantEvent(LobbyParticipant participant) implements LobbyParticipantEvent, LobbyClientEvent {}
