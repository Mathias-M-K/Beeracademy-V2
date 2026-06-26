package dk.mathiaskofod.services.session.actions.lobby.client;

import dk.mathiaskofod.services.session.models.annotations.ActionType;

@ActionType("REMOVE_PARTICIPANT")
public record RemoveParticipantAction(String participantId) implements LobbyClientAction {}
