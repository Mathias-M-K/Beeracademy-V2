package dk.mathiaskofod.api.lobby.models;

import org.eclipse.microprofile.openapi.annotations.media.Schema;

@Schema(description = "Response payload after successfully registering a player in a lobby")
public record RegisterPlayerResponse(
        @Schema(description = "The unique participant/player ID")
        String id) {}
