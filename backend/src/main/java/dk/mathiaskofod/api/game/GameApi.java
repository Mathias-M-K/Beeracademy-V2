package dk.mathiaskofod.api.game;

import dk.mathiaskofod.api.game.models.CreateGameRequest;
import dk.mathiaskofod.common.dto.game.GameDto;
import dk.mathiaskofod.common.dto.game.GameIdDto;
import dk.mathiaskofod.common.dto.player.PlayerDto;
import dk.mathiaskofod.domain.game.reports.GameReport;
import dk.mathiaskofod.domain.game.reports.PlayerReport;
import dk.mathiaskofod.domain.game.timer.TimerReports;
import dk.mathiaskofod.services.game.GameService;
import dk.mathiaskofod.services.lobby.LobbyService;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
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

    @Inject
    GameService gameService;

    @ConfigProperty(name = "env")
    String environment;

    @POST
    @ResponseStatus(200)
    @Operation(summary = "Create a new game", description = "Creates a new game with the provided details")
    public GameIdDto createGame(CreateGameRequest request) {
        return new GameIdDto(lobbyService.createGame(request));
    }

    @GET
    @Path("/{gameId}")
    @Operation(summary = "Get game", description = "Retrieves the details of a specific game by its ID")
    public GameDto getGame(@Valid @PathParam("gameId") GameIdDto gameIdDto) {
        return lobbyService.getGame(gameIdDto.gameId());
    }

    @GET
    @Path("/{gameId}/claim")
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
    public Response claimGame(@Valid @PathParam("gameId") GameIdDto gameIdDto) {

        String sessionJwt = lobbyService.claimGame(gameIdDto.gameId());

        return generateJwtCookieResponse(sessionJwt);
    }

    @GET
    @Path("/{gameId}/players")
    @Operation(summary = "Get players in game", description = "Retrieves the list of players in a specific game")
    public List<PlayerDto> getPlayersInGame(@Valid @PathParam("gameId") GameIdDto gameIdDto) {
        return lobbyService.getPlayersInGame(gameIdDto.gameId());
    }

    /**
     * Claim a player session and set a session cookie containing a JWT.
     *
     * @param gameIdDto DTO containing the game identifier to claim the player in
     * @param playerId  the identifier of the player to claim
     * @return          an HTTP response with a `session_jwt` cookie containing the session JWT
     */
    @GET
    @Path("/{gameId}/players/{playerId}/claim")
    @Operation(summary = "Claim player", description = "Claims a player session and returns an cookie with jwt")
    public Response claimPlayer(@Valid @PathParam("gameId") GameIdDto gameIdDto, @PathParam("playerId") String playerId) {

        String sessionJwt = lobbyService.claimPlayer(gameIdDto.gameId(), playerId);

        return generateJwtCookieResponse(sessionJwt);
    }

    /**
     * Retrieve the end-of-game report for the specified game.
     *
     * @param gameIdDto wrapper containing the game identifier
     * @return the game's end-of-game report
     */
    @GET
    @Path("/{gameId}/reports/game")
    @Operation(summary = "Get end of game report for game, players and time", description = "Retrieves the end of game report for a specific game")
    public GameReport getGameReport(@Valid @PathParam("gameId") GameIdDto gameIdDto) {
        return gameService.getGameReport(gameIdDto.gameId());
    }

    /**
     * Retrieve per-player end-of-game reports for the specified game.
     *
     * @param gameIdDto wrapper containing the game id to fetch player reports for
     * @return a list of PlayerReport objects, one entry per player in the game
     */
    @GET
    @Path("/{gameId}/reports/players")
    @Operation(summary = "Get end of game report for game, players and time", description = "Retrieves the end of game report for a specific game")
    public List<PlayerReport> getPlayerReport(@Valid @PathParam("gameId") GameIdDto gameIdDto) {
        return gameService.getPlayerReports(gameIdDto.gameId());
    }

    /**
     * Retrieve time-based end-of-game reports for the specified game.
     *
     * @param gameIdDto DTO containing the game ID path parameter to query
     * @return Time-based end-of-game reports for the specified game
     */
    @GET
    @Path("/{gameId}/reports/time")
    @Operation(summary = "Get end of game report for game, players and time", description = "Retrieves the end of game report for a specific game")
    public TimerReports getTimeReport(@Valid @PathParam("gameId") GameIdDto gameIdDto) {
        return gameService.getTimeReport(gameIdDto.gameId());
    }

    /**
     * Builds an HTTP response containing a session_jwt cookie derived from the provided JWT
     * and configured according to the current environment.
     *
     * @param jwt the JWT to store in the cookie; if `null` an empty value is used and any line breaks are removed
     * @return a 200 OK response with a `session_jwt` cookie that expires in one day. In the "dev" environment the cookie is not `HttpOnly`, not `Secure`, and uses `SameSite=LAX`; otherwise it is `HttpOnly`, `Secure`, and uses `SameSite=NONE`.
    private Response generateJwtCookieResponse(String jwt) {

        String sanitizedJwt = (jwt == null) ? "" : jwt.replaceAll("[\\r\\n]", "");

        boolean isDev = environment.equalsIgnoreCase("dev");

        NewCookie cookie = new NewCookie.Builder("session_jwt")
                .httpOnly(!isDev)
                .secure(!isDev)
                .sameSite(isDev ? NewCookie.SameSite.LAX : NewCookie.SameSite.NONE)
                .path("/")
                .value(sanitizedJwt)
                .build();

        return Response.ok()
                .expires(Date.from(Instant.now().plus(Duration.ofDays(1))))
                .cookie(cookie)
                .build();
    }
}