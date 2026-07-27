package dk.mathiaskofod.services.session.actions.lobby.common;

import dk.mathiaskofod.services.lobby.models.Emoji;
import dk.mathiaskofod.services.session.actions.lobby.client.LobbyClientAction;
import dk.mathiaskofod.services.session.actions.lobby.participant.LobbyParticipantAction;
import dk.mathiaskofod.services.session.models.annotations.ActionType;

@ActionType("SEND_EMOJI")
public record SendEmojiAction(Emoji emoji) implements LobbyParticipantAction, LobbyClientAction {}
