package dk.mathiaskofod.services.session.events.game.game;

import dk.mathiaskofod.services.session.models.annotations.EventType;

@EventType("GAME_START")
public record GameStartGameEventDto() implements GameEventDto {}
