package dk.mathiaskofod.services.session.actions.lobby.common;

import dk.mathiaskofod.services.session.actions.lobby.client.LobbyClientAction;
import dk.mathiaskofod.services.session.actions.lobby.participant.LobbyParticipantAction;
import dk.mathiaskofod.services.session.models.annotations.ActionType;

@ActionType("SEND_MESSAGE")
public record SendMessageAction(String message) implements LobbyParticipantAction, LobbyClientAction {}
