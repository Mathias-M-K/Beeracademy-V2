package dk.mathiaskofod.services.auth.models;

public enum CustomJwtClaims {
    GAME_ID,
    PLAYER_ID,
    PLAYER_NAME;

    public String getName() {
        return this.name();
    }
}
