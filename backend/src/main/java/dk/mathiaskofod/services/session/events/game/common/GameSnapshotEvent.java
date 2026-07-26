package dk.mathiaskofod.services.session.events.game.common;

import dk.mathiaskofod.common.dto.game.GameDto;
import dk.mathiaskofod.services.session.events.game.gameclient.GameClientEvent;
import dk.mathiaskofod.services.session.events.game.playerclient.PlayerClientEvent;
import dk.mathiaskofod.services.session.models.annotations.EventType;

//TODO maybe we can get these auto generated in the frontend if we annotate them with @schema?
@EventType("HELLO_GAME_SNAPSHOT")
public record GameSnapshotEvent(GameDto gameState) implements GameClientEvent, PlayerClientEvent {
}
