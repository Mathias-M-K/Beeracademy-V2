package dk.mathiaskofod.services.session.actions.lobby.client;

import dk.mathiaskofod.services.session.models.annotations.ActionType;

@ActionType("KICK_PARTICIPANT")
public record KickParticipantAction(String participantId, String kickReason) implements LobbyClientAction {}
