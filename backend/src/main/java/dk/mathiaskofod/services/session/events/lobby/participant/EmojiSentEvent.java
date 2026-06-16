package dk.mathiaskofod.services.session.events.lobby.participant;

import dk.mathiaskofod.services.lobby.models.Emoji;
import dk.mathiaskofod.services.session.models.annotations.EventType;

@EventType("EMOJI_SENT")
public record EmojiSentEvent(String senderId, Emoji emoji) implements LobbyParticipantEvent {}
