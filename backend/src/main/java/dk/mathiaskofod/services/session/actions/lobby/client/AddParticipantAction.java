package dk.mathiaskofod.services.session.actions.lobby.client;

import dk.mathiaskofod.services.session.models.annotations.ActionType;

@ActionType("CREATE_PARTICIPANT")
public record AddParticipantAction(String name) implements LobbyClientAction {}
