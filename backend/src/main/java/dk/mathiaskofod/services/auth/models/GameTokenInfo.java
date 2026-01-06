package dk.mathiaskofod.services.auth.models;

import org.eclipse.microprofile.jwt.JsonWebToken;

public record GameTokenInfo(String gameId) {

    public static GameTokenInfo fromToken(JsonWebToken token){
        String gameId = token.getClaim(CustomJwtClaims.GAME_ID.getName());

        return new GameTokenInfo(gameId);
    }
}
