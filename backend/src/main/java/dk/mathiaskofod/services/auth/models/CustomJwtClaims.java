package dk.mathiaskofod.services.auth.models;

public enum CustomJwtClaims {
    GAME_ID,
    PLAYER_ID;

    public String getName() {
        return this.name();
    }
}
