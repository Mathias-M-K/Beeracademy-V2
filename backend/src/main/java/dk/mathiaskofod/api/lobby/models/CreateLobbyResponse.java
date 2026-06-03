package dk.mathiaskofod.api.lobby.models;

import org.eclipse.microprofile.openapi.annotations.media.Schema;

@Schema(description = "Response payload after successfully creating a lobby")
public record CreateLobbyResponse(
        @Schema(description = "The unique 9-character alphanumeric lobby ID", examples = "aB3cD5eF7")
        String lobbyId) {}
