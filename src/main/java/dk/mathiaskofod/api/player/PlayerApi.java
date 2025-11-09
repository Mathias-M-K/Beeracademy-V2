package dk.mathiaskofod.api.player;

import dk.mathiaskofod.api.game.models.PlayerDto;
import dk.mathiaskofod.services.game.GameService;
import dk.mathiaskofod.services.game.game.id.generator.models.GameId;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.QueryParam;
import lombok.extern.slf4j.Slf4j;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

import java.util.List;

@Slf4j
@Path("/players")
@Tag(name = "Player API", description = "Operations related to players in a game")
public class PlayerApi {

    @Inject
    GameService gameService;

    @GET
    @Operation(summary = "Get Players in Game", description = "Retrieve a list of players participating in a specific game by providing the game ID.")
    public List<PlayerDto> getPlayers(@Valid @QueryParam("game-id") GameId gameId) {
        return gameService.getPlayersInGame(gameId).stream()
                .map(PlayerDto::fromPlayer)
                .toList();
    }
}
