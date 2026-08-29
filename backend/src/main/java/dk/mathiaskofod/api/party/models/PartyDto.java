package dk.mathiaskofod.api.party.models;

import dk.mathiaskofod.common.dto.session.SessionDto;
import dk.mathiaskofod.services.party.models.PartyState;
import org.eclipse.microprofile.openapi.annotations.media.Schema;

import java.util.List;

@Schema(description = "Data transfer object representing a party and its participants")
public record PartyDto(
        @Schema(required = true)
        PartyState partyState,

        @Schema(required = true, description = "Name of the party")
        String name,

        @Schema(required = true, description = "Unique id of the party")
        String id,

        @Schema(required = true, description = "List of participants")
        List<PartyParticipantDto> participants,

        @Schema(required = true, description = "Session info describing connection status of the owner of the party")
        SessionDto session) {


}
