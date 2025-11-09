package dk.mathiaskofod.api.game;

import dk.mathiaskofod.api.game.models.CreateGameRequest;
import dk.mathiaskofod.api.game.models.GameDto;
import dk.mathiaskofod.api.game.models.GameIdDto;
import dk.mathiaskofod.services.game.GameService;
import dk.mathiaskofod.services.game.game.id.generator.models.GameId;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;
import org.jboss.resteasy.reactive.ResponseStatus;

import java.util.List;

@Path("/games")
@Tag(name = "Game API", description = "API for managing games")
public class GameApi {

    @Inject
    GameService gameService;

    @POST
    @ResponseStatus(200)
    @Operation(summary = "Create a new game", description = "Creates a new game with the provided details")
    public GameIdDto createGame(CreateGameRequest request) {
        GameId gameId = gameService.createGame(request);
        return GameIdDto.fromGameId(gameId);
    }

    @GET
    @Operation(summary = "Get all games", description = "Retrieves a list of all games")
    public List<GameDto> getGames() {
        return gameService.getGames().stream()
                .map(GameDto::fromGame)
                .toList();
    }
}
