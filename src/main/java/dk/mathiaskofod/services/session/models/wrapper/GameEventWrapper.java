package dk.mathiaskofod.services.session.models.wrapper;


import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import dk.mathiaskofod.services.session.models.events.game.GameEndGameEventDto;


public record GameEventWrapper(Object payload) implements WebsocketEnvelope {
}
