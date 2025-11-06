package dk.mathiaskofod.api.game;

import dk.mathiaskofod.api.game.models.CreateGameRequest;
import dk.mathiaskofod.api.game.models.GameDto;
import dk.mathiaskofod.api.game.models.GameIdResponse;
import dk.mathiaskofod.services.game.GameService;
import dk.mathiaskofod.services.game.game.id.generator.models.GameId;
import dk.mathiaskofod.services.game.models.Game;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import org.jboss.resteasy.reactive.ResponseStatus;

import java.util.List;

@Path("/games")
public class GameApi {

    @Inject
    GameService gameService;

    @POST
    @ResponseStatus(200)
    public GameIdResponse createGame(CreateGameRequest request) {
        GameId gameId = gameService.createGame(request);
        return GameIdResponse.fromGameId(gameId);
    }

    @GET
    public List<GameDto> getGames() {
        return gameService.getGames().stream()
                .map(GameDto::fromGame)
                .toList();
    }
}
