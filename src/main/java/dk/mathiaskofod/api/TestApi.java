package dk.mathiaskofod.api;

import dk.mathiaskofod.domain.game.models.GameId;
import dk.mathiaskofod.services.session.events.domain.game.GameEventDto;
import dk.mathiaskofod.services.session.events.domain.game.GameStartGameEventDto;
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
        GameEventDto dto = new GameStartGameEventDto(new GameId("123123123"));
        return new GameEventEnvelope(dto);
    }
}
