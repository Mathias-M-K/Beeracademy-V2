package dk.mathiaskofod.api.party.models;

import dk.mathiaskofod.common.dto.session.SessionDto;
import dk.mathiaskofod.services.party.models.PartyParticipant;
import org.eclipse.microprofile.openapi.annotations.media.Schema;

@Schema(description = "Data transfer object representing a party participant")
public record PartyParticipantDto(

        @Schema(required = true, description = "Name of the participant")
        String name,

        @Schema(required = true, description = "Unique id of the participant")
        String id,

        @Schema(required = true, description = "Session info describing connection status of the participant")
        SessionDto session) {

    public static PartyParticipantDto create(PartyParticipant participant, SessionDto session) {
        return new PartyParticipantDto(participant.name(), participant.id(), session);
    }
}
