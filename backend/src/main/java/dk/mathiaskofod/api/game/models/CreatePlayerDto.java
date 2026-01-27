package dk.mathiaskofod.api.game.models;

import org.eclipse.microprofile.openapi.annotations.media.Schema;

public record CreatePlayerDto(

        @Schema(
                title = "Player name",
                description = "The name of the player",
                examples = {"Alice"}
        )
        String playerName,

        @Schema(
                title = "Sips in a beer",
                description = "The number of sips in a beer for this player",
                examples = {"8"},
                defaultValue = "14"
        )
        int sipsInABeer,

        @Schema(
                title = "Can draw chug card",
                description = "Indicates if the player is allowed to draw a chug card",
                examples = {"true"},
                defaultValue = "true"
        )
        boolean canDrawChugCard
) {
}
