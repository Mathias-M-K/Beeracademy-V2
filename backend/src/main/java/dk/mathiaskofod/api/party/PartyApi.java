package dk.mathiaskofod.api.party;

import dk.mathiaskofod.api.party.models.CurrentPartyDto;
import dk.mathiaskofod.api.party.models.PartyDto;
import dk.mathiaskofod.common.dto.party.PartyIdDto;
import dk.mathiaskofod.services.auth.models.TokenInfo;
import dk.mathiaskofod.services.party.PartyService;
import io.quarkus.security.Authenticated;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import lombok.extern.slf4j.Slf4j;
import org.eclipse.microprofile.jwt.JsonWebToken;
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
    @Authenticated
    public CurrentPartyDto getCurrentParty() {
        TokenInfo tokenInfo = new TokenInfo(jwt);
        PartyDto partyState = partyService.getPartyState(tokenInfo.getPartyId());
        String playerId = tokenInfo.findPlayerId().orElse(null);

        return new CurrentPartyDto(tokenInfo.getRole(), playerId, partyState);
    }
}
