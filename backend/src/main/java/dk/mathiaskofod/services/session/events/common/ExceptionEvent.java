package dk.mathiaskofod.services.session.events.common;

import dk.mathiaskofod.providers.exceptions.mappers.ExceptionResponse;
import dk.mathiaskofod.services.session.events.game.gameclient.GameClientEvent;
import dk.mathiaskofod.services.session.models.annotations.EventType;

@EventType("EXCEPTION_RESPONSE")
public record ExceptionEvent(ExceptionResponse response) implements GameClientEvent {
}
