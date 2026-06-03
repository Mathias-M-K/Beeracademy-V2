package dk.mathiaskofod.api.lobby.models;

import dk.mathiaskofod.services.lobby.models.LobbyParticipant;
import org.eclipse.microprofile.openapi.annotations.media.Schema;

@Schema(description = "Response payload after successfully registering a player in a lobby")
public record RegisterPlayerResponse(
        @Schema(description = "The registered player's name", examples = "Bob")
        String name,

        @Schema(description = "The title assigned to the player", examples = "Apprentice")
        String title,

        @Schema(description = "The unique participant/player ID", examples = "d9b23f81-5c8e-4a61-a021-c4238e8f8101")
        String id) {

    public static RegisterPlayerResponse fromParticipant(LobbyParticipant participant) {
        return new RegisterPlayerResponse(participant.name(), participant.title(), participant.id());
    }
}
