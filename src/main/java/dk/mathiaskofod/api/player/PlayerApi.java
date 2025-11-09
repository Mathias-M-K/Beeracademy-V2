package dk.mathiaskofod.api.player;

import dk.mathiaskofod.api.auth.models.Token;
import dk.mathiaskofod.api.game.models.PlayerDto;
import dk.mathiaskofod.services.game.GameService;
import dk.mathiaskofod.services.game.game.id.generator.models.GameId;
import dk.mathiaskofod.services.player.PlayerConnectionService;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.validation.Validator;
import jakarta.validation.constraints.NotNull;
import jakarta.ws.rs.*;
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

    @Inject
    PlayerConnectionService playerConnectionService;

    @GET
    @Operation(summary = "Get Players in Game", description = "Retrieve a list of players participating in a specific game by providing the game ID.")
    public List<PlayerDto> getPlayers(@Valid @NotNull @QueryParam("gameId") GameId gameId) {
        return gameService.getGame(gameId).players().stream()
                .map(PlayerDto::fromPlayer)
                .toList();
    }

    @POST
    @Path("/{playerId}/claim")
    @Operation(summary = "Claim Player", description = "Claim a player in a specific game by providing the game ID and player ID.")
    public Token claimPlayer(@PathParam("playerId") String playerId, @QueryParam("gameId") GameId gameId) {
        return playerConnectionService.claimPlayer(gameId,playerId);
    }
}
