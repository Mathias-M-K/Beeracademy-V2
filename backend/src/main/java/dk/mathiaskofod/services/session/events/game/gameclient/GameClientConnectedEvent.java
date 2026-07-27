package dk.mathiaskofod.services.session.events.game.gameclient;

import dk.mathiaskofod.services.session.models.annotations.EventType;

@EventType("CLIENT_CONNECTED")
public record GameClientConnectedEvent() implements GameClientEvent {}
