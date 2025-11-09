package dk.mathiaskofod.api.game.models;

import org.eclipse.microprofile.openapi.annotations.media.Schema;

import java.util.List;

public record CreateGameRequest(

        @Schema(title = "Name",
                description = "Name of the game",
                examples = {"My awesome game"})
        String name,

        @Schema(title = "Player Names",
                description = "List of player names to join the game",
                examples = {"[\"Alice\", \"Bob\", \"Charlie\"]"})
        List<String> playerNames) {
}
