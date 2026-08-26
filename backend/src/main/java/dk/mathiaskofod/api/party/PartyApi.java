package dk.mathiaskofod.api.party;

import dk.mathiaskofod.api.party.models.PartyStateDto;
import dk.mathiaskofod.common.dto.party.PartyIdDto;
import dk.mathiaskofod.services.party.PartyService;
import dk.mathiaskofod.services.party.models.PartyState;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.BeanParam;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.core.Response;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Path("/parties")
public class PartyApi {

    @Inject
    PartyService partyService;

    @GET
    @Path("/{partyId}/state")
    public Response getPartyState(@Valid @BeanParam PartyIdDto partyIdDto){
        PartyState partyState = partyService.getPartyState(partyIdDto.partyId());
        return Response.ok().entity(new PartyStateDto(partyState)).build();
    }
}
