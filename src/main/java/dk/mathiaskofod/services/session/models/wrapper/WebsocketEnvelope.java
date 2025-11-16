package dk.mathiaskofod.services.session.models.wrapper;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;

@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "eventCategory")
@JsonSubTypes({
        @JsonSubTypes.Type(value = GameEventWrapper.class, name = "GAME")
})
public interface WebsocketEnvelope {




}
