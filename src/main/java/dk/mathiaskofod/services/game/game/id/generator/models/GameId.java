package dk.mathiaskofod.services.game.game.id.generator.models;

public record GameId(String id) {

    /**
     * Convert the game ID to a human-readable format (XXX-XXX-XXX)
     * @return String in the format XXX-XXX-XXX
     */
    public String humanReadableId(){
        return id.substring(0,3) + "-" + id.substring(3,6) + "-" + id.substring(6,9);
    }
}
