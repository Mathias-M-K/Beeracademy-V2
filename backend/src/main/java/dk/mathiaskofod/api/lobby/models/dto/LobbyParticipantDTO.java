package dk.mathiaskofod.api.lobby.models.dto;

import dk.mathiaskofod.services.lobby.models.LobbyParticipant;
import org.eclipse.microprofile.openapi.annotations.media.Schema;

@Schema(description = "Data transfer object representing a participant/player in a lobby")
public record LobbyParticipantDTO(
        @Schema(description = "The participant's name", examples = "Bob")
        String name,

        @Schema(description = "The title assigned to the participant", examples = "Apprentice")
        String title,

        @Schema(description = "The unique 12-character ID", examples = "FZQ-V0Y-YG0-UAE")
        String id,

        @Schema(description = "The number of sips that make up a beer for this participant", examples = "14")
        int sipsInABeer,

        @Schema(description = "Whether the participant is allowed to draw an ace", examples = "true")
        boolean canDrawAce) {
    public static LobbyParticipantDTO fromLobbyParticipant(LobbyParticipant participant) {
        return new LobbyParticipantDTO(
                participant.getName(),
                participant.getTitle(),
                participant.getId(),
                participant.getSipsInABeer(),
                participant.isCanDrawAce());
    }
}
