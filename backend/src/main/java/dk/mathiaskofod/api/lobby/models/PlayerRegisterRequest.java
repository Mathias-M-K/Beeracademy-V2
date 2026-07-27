package dk.mathiaskofod.api.lobby.models;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.QueryParam;
import org.eclipse.microprofile.openapi.annotations.parameters.Parameter;

public record PlayerRegisterRequest(
        @Parameter(description = "The unique 9-character alphanumeric lobby ID", required = true, example = "aB3cD5eF7")
        @PathParam("lobbyId")
        @Pattern(regexp = "^[A-Za-z0-9]{9}$", message = "Invalid game ID format") String lobbyId,

        @Parameter(description = "The name of the player registering in the lobby", required = true, example = "Bob")
        @QueryParam("participantName")
        @NotEmpty(message = "Player name must not be empty") String playerName) {}
