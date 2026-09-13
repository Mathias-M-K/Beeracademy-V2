package dk.mathiaskofod.api.party;

import dk.mathiaskofod.api.party.models.CurrentPartyDto;
import dk.mathiaskofod.api.party.models.PartyDto;
import dk.mathiaskofod.common.dto.party.PartyIdDto;
import dk.mathiaskofod.services.auth.models.TokenInfo;
import dk.mathiaskofod.services.party.PartyService;
import dk.mathiaskofod.services.party.exceptions.PartyNotFoundException;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.core.Response;
import lombok.extern.slf4j.Slf4j;
import org.eclipse.microprofile.jwt.JsonWebToken;
import org.eclipse.microprofile.openapi.annotations.media.Content;
import org.eclipse.microprofile.openapi.annotations.media.Schema;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponse;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

@Slf4j
@Path("/parties")
@Tag(name = "Party API", description = "API endpoint fetching info about parties")
public class PartyApi {

    @Inject
    PartyService partyService;

    @Inject
    JsonWebToken jwt;

    @GET
    @Path("/{partyId}")
    public PartyDto getParty(@Valid @PathParam("partyId") PartyIdDto partyIdDto) {
        return partyService.getPartyState(partyIdDto.partyId());
    }

    @GET
    @Path("/current")
    @APIResponse(
            responseCode = "200",
            description = "The party the caller's token belongs to.",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = CurrentPartyDto.class)))
    @APIResponse(responseCode = "204", description = "The caller has no token, or the token's party no longer exists.")
    public Response getCurrentParty() {
        if (jwt.getRawToken() == null) {
            return Response.noContent().build();
        }

        TokenInfo tokenInfo = new TokenInfo(jwt);
        PartyDto partyState;
        try {
            partyState = partyService.getPartyState(tokenInfo.getPartyId());
        } catch (PartyNotFoundException e) {
            return Response.noContent().build();
        }
        String playerId = tokenInfo.findPlayerId().orElse(null);

        return Response.ok(new CurrentPartyDto(tokenInfo.getRole(), playerId, partyState)).build();
    }
}
