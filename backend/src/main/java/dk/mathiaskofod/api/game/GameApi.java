package dk.mathiaskofod.api.game;

import dk.mathiaskofod.api.game.models.CreateGameRequest;
import dk.mathiaskofod.api.game.models.GameDto;
import dk.mathiaskofod.api.game.models.GameIdDto;
import dk.mathiaskofod.api.game.models.PlayerDto;
import dk.mathiaskofod.services.auth.models.Token;
import dk.mathiaskofod.services.lobby.LobbyService;
import dk.mathiaskofod.domain.game.models.GameId;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;
import org.jboss.resteasy.reactive.ResponseStatus;

import java.util.List;

@Path("/games")
@Tag(name = "Game API", description = "API for managing games")
public class GameApi {

    @Inject
    LobbyService lobbyService;


    @POST
    @ResponseStatus(200)
    @Operation(summary = "Create a new game", description = "Creates a new game with the provided details")
    public GameIdDto createGame(CreateGameRequest request) {
        return lobbyService.createGame(request);
    }

    @GET
    @Path("/{game-id}")
    @Operation(summary = "Get game", description = "Retrieves the details of a specific game by its ID")
    public GameDto getGame(@Valid @PathParam("game-id") GameId gameId) {
        return lobbyService.getGame(gameId);
    }

    @GET
    @Path("{game-id}/claim")
    @Operation(summary = "Claim game", description = "Claims a game session and returns an authentication token")
    public Token claimGame(@Valid @PathParam("game-id") GameId gameId){
        return lobbyService.claimGame(gameId);
    }

    @GET
    @Path("{game-id}/players")
    @Operation(summary = "Get players in game", description = "Retrieves the list of players in a specific game")
    public List<PlayerDto> getPlayersInGame(@Valid @PathParam("game-id") GameId gameId) {
        return lobbyService.getPlayersInGame(gameId);
    }

    @GET
    @Path("{game-id}/players/{player-id}/claim")
    @Operation(summary = "Claim player", description = "Claims a player session and returns an authentication token")
    public Token claimPlayer(@Valid @PathParam("game-id") GameId gameId, @PathParam("player-id") String playerId) {
        return lobbyService.claimPlayer(gameId, playerId);
    }


}
