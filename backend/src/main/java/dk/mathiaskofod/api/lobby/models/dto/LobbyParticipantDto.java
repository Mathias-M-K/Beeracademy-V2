package dk.mathiaskofod.api.lobby.models.dto;

import dk.mathiaskofod.services.lobby.models.LobbyParticipant;
import org.eclipse.microprofile.openapi.annotations.media.Schema;

@Schema(description = "Data transfer object representing a participant/player in a lobby")
public record LobbyParticipantDto(
        @Schema(description = "The participant's name", examples = "Bob")
        String name,

        @Schema(description = "The title assigned to the participant", examples = "Apprentice")
        String title,

        @Schema(description = "The unique 12-character ID", examples = "FZQ-V0Y-YG0-UAE")
        String id
) {
    public static LobbyParticipantDto fromLobbyParticipant(LobbyParticipant participant) {
        return new LobbyParticipantDto(participant.name(), participant.title(), participant.id());
    }
}
