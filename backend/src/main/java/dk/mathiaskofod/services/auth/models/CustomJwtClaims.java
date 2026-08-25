package dk.mathiaskofod.services.auth.models;

public enum CustomJwtClaims {
    PARTY_ID,
    PLAYER_ID;

    public String getName() {
        return this.name();
    }
}
