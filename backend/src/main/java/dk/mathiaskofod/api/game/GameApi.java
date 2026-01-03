package dk.mathiaskofod.api.game;

import dk.mathiaskofod.api.game.models.CreateGameRequest;
import dk.mathiaskofod.api.game.models.GameDto;
import dk.mathiaskofod.api.game.models.GameIdDto;
import dk.mathiaskofod.api.game.models.PlayerDto;
import dk.mathiaskofod.services.lobby.LobbyService;
import dk.mathiaskofod.domain.game.models.GameId;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.NewCookie;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.enums.SchemaType;
import org.eclipse.microprofile.openapi.annotations.headers.Header;
import org.eclipse.microprofile.openapi.annotations.media.Content;
import org.eclipse.microprofile.openapi.annotations.media.Schema;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponse;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;
import org.jboss.resteasy.reactive.ResponseStatus;

import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.List;

@Path("/games")
@Tag(name = "Game API", description = "API for managing games")
public class GameApi {

    @Inject
    LobbyService lobbyService;

    @ConfigProperty(name = "env")
    String environment;


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
    @Operation(summary = "Claim game", description = "Claims a game session and returns an authentication token as cookie")
    @APIResponse(
            responseCode = "200",
            description = "Login successful, JWT returned in a secure cookie",
            headers = {
                    @Header(
                            name = "Set-Cookie",
                            description = "Contains the JWT session token",
                            schema = @Schema(type = SchemaType.STRING)
                    )
            },
            content = @Content(schema = @Schema(hidden = true))
    )
    public Response claimGame(@Valid @PathParam("game-id") GameId gameId) {

        String sessionJwt = lobbyService.claimGame(gameId);

        return generateJwtCookieResponse(sessionJwt);
    }

    @GET
    @Path("{game-id}/players")
    @Operation(summary = "Get players in game", description = "Retrieves the list of players in a specific game")
    public List<PlayerDto> getPlayersInGame(@Valid @PathParam("game-id") GameId gameId) {
        return lobbyService.getPlayersInGame(gameId);
    }

    @GET
    @Path("{game-id}/players/{player-id}/claim")
    @Operation(summary = "Claim player", description = "Claims a player session and returns an cookie with jwt")
    public Response claimPlayer(@Valid @PathParam("game-id") GameId gameId, @PathParam("player-id") String playerId) {

        String sessionJwt = lobbyService.claimPlayer(gameId, playerId);

        return generateJwtCookieResponse(sessionJwt);

    }

    private Response generateJwtCookieResponse(String jwt){

        boolean isDev = environment.equals("dev");

        NewCookie cookie = new NewCookie.Builder("session_jwt")
                .httpOnly(!isDev)
                .secure(!isDev)
                .sameSite(isDev ? NewCookie.SameSite.NONE : NewCookie.SameSite.STRICT)
                .path("/")
                .value(jwt)
                .build();

        return Response.ok()
                .expires(Date.from(Instant.now().plus(Duration.ofDays(1))))
                .cookie(cookie)
                .build();
    }
}
