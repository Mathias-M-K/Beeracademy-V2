package dk.mathiaskofod.services.session.events.lobby.client;

import dk.mathiaskofod.services.session.models.annotations.EventType;

@EventType("LOBBY_GAME_STARTED")
public record GameStartedEvent() implements LobbyClientEvent {}
