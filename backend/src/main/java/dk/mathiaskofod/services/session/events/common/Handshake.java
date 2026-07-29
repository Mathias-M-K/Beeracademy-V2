package dk.mathiaskofod.services.session.events.common;

import dk.mathiaskofod.services.session.events.game.gameclient.GameClientEvent;
import dk.mathiaskofod.services.session.events.game.playerclient.PlayerClientEvent;
import dk.mathiaskofod.services.session.events.lobby.client.LobbyClientEvent;
import dk.mathiaskofod.services.session.events.lobby.participant.LobbyParticipantEvent;
import dk.mathiaskofod.services.session.models.annotations.EventType;

@EventType("HANDSHAKE")
public record Handshake() implements PlayerClientEvent, GameClientEvent, LobbyParticipantEvent, LobbyClientEvent {
}
