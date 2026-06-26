package dk.mathiaskofod.services.session.events.lobby.common;

import dk.mathiaskofod.services.lobby.models.Emoji;
import dk.mathiaskofod.services.session.events.lobby.client.LobbyClientEvent;
import dk.mathiaskofod.services.session.events.lobby.participant.LobbyParticipantEvent;
import dk.mathiaskofod.services.session.models.annotations.EventType;

@EventType("EMOJI_SENT")
public record EmojiSentEvent(String senderId, Emoji emoji) implements LobbyParticipantEvent, LobbyClientEvent {}
