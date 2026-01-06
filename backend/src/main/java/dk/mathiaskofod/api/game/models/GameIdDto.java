package dk.mathiaskofod.api.game.models;

import jakarta.validation.constraints.Pattern;

public record GameIdDto(
        @Pattern(regexp = "^(?:[A-Za-z0-9]{3}-[A-Za-z0-9]{3}-[A-Za-z0-9]{3}|[A-Za-z0-9]{9})$", message = "Invalid game ID format")
        String gameId) {

    public GameIdDto(String gameId) {
        this.gameId = gameId.replaceAll("-", "");
    }
}
