package dk.mathiaskofod.api.lobby;

import dk.mathiaskofod.api.lobby.models.CreateLobbyResponse;
import dk.mathiaskofod.api.lobby.models.PlayerRegisterRequest;
import dk.mathiaskofod.api.lobby.models.RegisterPlayerResponse;
import dk.mathiaskofod.api.lobby.models.dto.LobbyDTO;
import dk.mathiaskofod.services.auth.AuthenticationService;
import dk.mathiaskofod.services.auth.SessionCookieFactory;
import dk.mathiaskofod.services.game.id.generator.IdGenerator;
import dk.mathiaskofod.services.lobby.LobbyService;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.NewCookie;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.enums.SchemaType;
import org.eclipse.microprofile.openapi.annotations.headers.Header;
import org.eclipse.microprofile.openapi.annotations.media.Content;
import org.eclipse.microprofile.openapi.annotations.media.Schema;
import org.eclipse.microprofile.openapi.annotations.parameters.Parameter;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponse;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

@Path("/lobbies")
@Tag(name = "Lobby API", description = "API for managing game lobbies and participant registration")
public class LobbyApi {

    @Inject
    LobbyService lobbyService;

    @Inject
    SessionCookieFactory sessionCookieFactory;

    @Inject
    AuthenticationService authenticationService;

    @POST
    @Operation(
            summary = "Create a new lobby",
            description =
                    "Creates a new lobby with the specified name and returns the lobby ID. Also generates a JWT token for the game client and sets it as an HTTP-only cookie in the response.")
    @APIResponse(
            responseCode = "202",
            description = "Lobby created successfully. Returns the lobby ID and sets a JWT token in a cookie.",
            headers = {
                @Header(
                        name = "Set-Cookie",
                        description = "Contains the JWT session token",
                        schema = @Schema(type = SchemaType.STRING))
            },
            content =
                    @Content(
                            mediaType = "application/json",
                            schema = @Schema(implementation = CreateLobbyResponse.class)))
    @APIResponse(responseCode = "400", description = "Invalid lobby name or parameter format.")
    public Response createLobby(
            @Parameter(description = "The name of the lobby to be created", required = true, example = "My Beer Lobby")
                    @NotEmpty @QueryParam("name")
                    String name) {
        String lobbyId = lobbyService.createLobby(name);
        String jwt = authenticationService.createGameClientToken(name, lobbyId);

        NewCookie cookieJwt = sessionCookieFactory.createSessionCookie(jwt);

        return Response.accepted()
                .entity(new CreateLobbyResponse(lobbyId))
                .cookie(cookieJwt)
                .build();
    }

    @GET
    @Path("/{lobbyId}")
    @Operation(
            summary = "Get lobby details",
            description = "Retrieves the status, name, and participants of a specific lobby by its ID.")
    @APIResponse(
            responseCode = "200",
            description = "Lobby retrieved successfully.",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = LobbyDTO.class)))
    @APIResponse(responseCode = "400", description = "Invalid lobby ID format.")
    @APIResponse(responseCode = "404", description = "Lobby not found.")
    public LobbyDTO getLobby(
            @Parameter(
                            description = "The unique 9-character alphanumeric lobby ID",
                            required = true,
                            example = "aB3cD5eF7")
                    @Pattern(regexp = "^[A-Za-z0-9]{9}$", message = "Invalid game ID format") @PathParam("lobbyId")
                    String lobbyId) {
        return LobbyDTO.fromLobby(lobbyService.getLobby(lobbyId));
    }

    @POST
    @Path("{lobbyId}/register")
    @Operation(
            summary = "Register a participant in a lobby",
            description =
                    "Registers a new player with the specified name in the lobby. Returns the player registration details and sets a JWT cookie for player authentication.")
    @APIResponse(
            responseCode = "200",
            description = "Player registered successfully. Returns registered player details and sets a JWT cookie.",
            headers = {
                @Header(
                        name = "Set-Cookie",
                        description = "Contains the JWT session token",
                        schema = @Schema(type = SchemaType.STRING))
            })
    public Response registerParticipant(@Valid @BeanParam PlayerRegisterRequest request) {
        lobbyService.getLobby(request.lobbyId());
        String playerId = IdGenerator.generatePlayerId();
        String jwt = authenticationService.createPlayerClientToken(request.playerName(), request.lobbyId(), playerId);

        NewCookie cookieJwt = sessionCookieFactory.createSessionCookie(jwt);

        return Response.ok()
                .entity(new RegisterPlayerResponse(playerId))
                .cookie(cookieJwt)
                .build();
    }
}
