package dk.mathiaskofod.api.party;

import dk.mathiaskofod.api.party.models.PartyDto;
import dk.mathiaskofod.common.dto.party.PartyIdDto;
import dk.mathiaskofod.services.party.PartyService;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.BeanParam;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Path("/parties")
public class PartyApi {

    @Inject
    PartyService partyService;

    @GET
    @Path("/{partyId}")
    public PartyDto getParty(@Valid @BeanParam PartyIdDto partyIdDto) {
        return partyService.getPartyState(partyIdDto.partyId());
    }
}
