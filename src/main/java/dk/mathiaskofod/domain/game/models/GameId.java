package dk.mathiaskofod.domain.game.models;

import jakarta.validation.constraints.Pattern;

public record GameId(
        @Pattern(regexp = "^(?:[A-Za-z0-9]{3}-[A-Za-z0-9]{3}-[A-Za-z0-9]{3}|[A-Za-z0-9]{9})$", message = "Invalid game ID format")
        String id
) {

    public GameId(String id) {
        this.id = id.replaceAll("-", "");
    }

    /**
     * Convert the game ID to a human-readable format (XXX-XXX-XXX)
     * @return String in the format XXX-XXX-XXX
     */
    public String humanReadableId(){
        return id.substring(0,3) + "-" + id.substring(3,6) + "-" + id.substring(6,9);
    }
}
