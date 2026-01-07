package dk.mathiaskofod.api;

import dk.mathiaskofod.services.session.events.game.GameEventDto;
import dk.mathiaskofod.services.session.events.game.GameStartGameEventDto;
import dk.mathiaskofod.services.session.envelopes.GameEventEnvelope;
import dk.mathiaskofod.services.session.envelopes.WebsocketEnvelope;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import lombok.extern.slf4j.Slf4j;

@Path("/test")
@Slf4j
public class TestApi {

    @GET
    public WebsocketEnvelope test() {
        GameEventDto dto = new GameStartGameEventDto();
        return new GameEventEnvelope(dto);
    }
}
