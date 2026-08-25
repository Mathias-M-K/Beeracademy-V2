package dk.mathiaskofod.services.session.events.game.playerclient;

import dk.mathiaskofod.services.session.models.annotations.EventType;

@EventType("PLAYER_CONNECTED")
public record PlayerConnectedEvent(String playerId, String partyId) implements PlayerClientEvent {}
