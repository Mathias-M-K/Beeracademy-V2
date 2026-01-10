package dk.mathiaskofod.services.session.envelopes;

import com.fasterxml.jackson.annotation.JsonTypeInfo;

@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "category")
public interface WebsocketEnvelope {
}
