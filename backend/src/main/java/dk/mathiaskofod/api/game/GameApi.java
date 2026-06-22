package dk.mathiaskofod.api.game;

import dk.mathiaskofod.common.dto.game.GameDto;
import dk.mathiaskofod.common.dto.game.GameIdDto;
import dk.mathiaskofod.common.dto.player.PlayerDto;
import dk.mathiaskofod.domain.game.player.Player;
import dk.mathiaskofod.domain.game.reports.GameReport;
import dk.mathiaskofod.domain.game.reports.PlayerReport;
import dk.mathiaskofod.domain.game.timer.TimerReports;
import dk.mathiaskofod.services.auth.AuthenticationService;
import dk.mathiaskofod.services.auth.SessionCookieFactory;
import dk.mathiaskofod.services.game.GameService;
import dk.mathiaskofod.services.game.GameSessionService;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.NewCookie;
import jakarta.ws.rs.core.Response;
import java.util.List;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.enums.SchemaType;
import org.eclipse.microprofile.openapi.annotations.headers.Header;
import org.eclipse.microprofile.openapi.annotations.media.Content;
import org.eclipse.microprofile.openapi.annotations.media.Schema;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponse;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

// TODO Split API into three different APIs, Lobby, Session and GameReport
@Path("/games")
@Tag(name = "Game API", description = "API for managing games")
public class GameApi {

    @Inject
    GameService gameService;

    @Inject
    GameSessionService gameSessionService;

    @Inject
    AuthenticationService authenticationService;

    @Inject
    SessionCookieFactory sessionCookieFactory;

    @GET
    @Path("/{gameId}")
    @Operation(summary = "Get game", description = "Retrieves the details of a specific game by its ID")
    public GameDto getGame(@Valid @BeanParam GameIdDto gameIdDto) {
        return gameSessionService.getGameView(gameIdDto.gameId());
    }

    @GET
    @Path("/{gameId}/claim")
    @Operation(
            summary = "Claim game",
            description = "Claims a game session and returns an authentication token as cookie")
    @APIResponse(
            responseCode = "200",
            description = "Login successful, JWT returned in a secure cookie",
            headers = {
                @Header(
                        name = "Set-Cookie",
                        description = "Contains the JWT session token",
                        schema = @Schema(type = SchemaType.STRING))
            },
            content = @Content(schema = @Schema(hidden = true)))
    public Response claimGame(@Valid @BeanParam GameIdDto gameIdDto) {

        String gameId = gameIdDto.gameId();
        gameSessionService.claimGame(gameId);
        String sessionJwt = authenticationService.createGameClientToken(gameId);

        NewCookie cookie = sessionCookieFactory.createSessionCookie(sessionJwt);
        return Response.ok().cookie(cookie).build();
    }

    @GET
    @Path("/{gameId}/players")
    @Operation(summary = "Get players in game", description = "Retrieves the list of players in a specific game")
    public List<PlayerDto> getPlayersInGame(@Valid @BeanParam GameIdDto gameIdDto) {
        return gameSessionService.getPlayerViews(gameIdDto.gameId());
    }

    @GET
    @Path("/{gameId}/players/{playerId}/claim")
    @Operation(summary = "Claim player", description = "Claims a player session and returns an cookie with jwt")
    public Response claimPlayer(@Valid @BeanParam GameIdDto gameIdDto, @PathParam("playerId") String playerId) {

        String gameId = gameIdDto.gameId();
        Player player = gameSessionService.claimPlayer(gameId, playerId);
        String sessionJwt = authenticationService.createPlayerClientToken(player.name(), gameId);

        NewCookie cookie = sessionCookieFactory.createSessionCookie(sessionJwt);
        return Response.ok().cookie(cookie).build();
    }

    @GET
    @Path("/{gameId}/reports/game")
    @Operation(
            summary = "Get end of game report for game, players and time",
            description = "Retrieves the end of game report for a specific game")
    public GameReport getGameReport(@Valid @BeanParam GameIdDto gameIdDto) {
        return gameService.getGameReport(gameIdDto.gameId());
    }

    @GET
    @Path("/{gameId}/reports/players")
    @Operation(
            summary = "Get end of game report for game, players and time",
            description = "Retrieves the end of game report for a specific game")
    public List<PlayerReport> getPlayerReport(@Valid @BeanParam GameIdDto gameIdDto) {
        return gameService.getPlayerReports(gameIdDto.gameId());
    }

    @GET
    @Path("/{gameId}/reports/time")
    @Operation(
            summary = "Get end of game report for game, players and time",
            description = "Retrieves the end of game report for a specific game")
    public TimerReports getTimeReport(@Valid @BeanParam GameIdDto gameIdDto) {
        return gameService.getTimeReport(gameIdDto.gameId());
    }
}
