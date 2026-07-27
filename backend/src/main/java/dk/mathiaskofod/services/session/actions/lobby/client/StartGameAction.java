package dk.mathiaskofod.services.session.actions.lobby.client;

import dk.mathiaskofod.services.session.models.annotations.ActionType;

@ActionType("LOBBY_START_GAME")
public record StartGameAction() implements LobbyClientAction {}
