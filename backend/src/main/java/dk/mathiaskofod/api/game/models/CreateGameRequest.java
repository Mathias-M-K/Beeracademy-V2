package dk.mathiaskofod.api.game.models;

import java.util.List;
import org.eclipse.microprofile.openapi.annotations.media.Schema;

public record CreateGameRequest(
        @Schema(
                title = "Name",
                description = "Name of the game",
                examples = {"My awesome game"})
        String name,

        @Schema(title = "Players", description = "List of players and their specifications")
        List<CreatePlayerDto> players) {}
