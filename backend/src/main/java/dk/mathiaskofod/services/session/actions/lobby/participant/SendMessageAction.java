package dk.mathiaskofod.services.session.actions.lobby.participant;

import dk.mathiaskofod.services.session.models.annotations.ActionType;

@ActionType("SEND_MESSAGE")
public record SendMessageAction(String message) implements LobbyParticipantAction {
}
