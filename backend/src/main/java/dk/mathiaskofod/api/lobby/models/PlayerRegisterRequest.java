package dk.mathiaskofod.api.lobby.models;

import dk.mathiaskofod.common.dto.party.PartyIdDto;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.QueryParam;
import org.eclipse.microprofile.openapi.annotations.parameters.Parameter;

public record PlayerRegisterRequest(
        @Parameter(description = "The unique 9-character alphanumeric party ID", required = true, example = "aB3cD5eF7")
        @PathParam("partyId")
        @Pattern(regexp = PartyIdDto.PATTERN, message = PartyIdDto.MESSAGE) String partyId,

        @Parameter(description = "The name of the player registering in the lobby", required = true, example = "Bob")
        @QueryParam("participantName")
        @NotEmpty(message = "Player name must not be empty") String playerName) {}
