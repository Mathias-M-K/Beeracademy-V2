package dk.mathiaskofod.services.session.actions.lobby.participant;

import dk.mathiaskofod.services.lobby.models.Emoji;
import dk.mathiaskofod.services.session.models.annotations.ActionType;

@ActionType("SEND_EMOJI")
public record SendEmojiAction(Emoji emoji) implements LobbyParticipantAction {}
