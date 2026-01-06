package dk.mathiaskofod.services.auth.models;

import org.eclipse.microprofile.jwt.JsonWebToken;

public record PlayerTokenInfo(String playerName, String playerId, String gameId) {

    public static PlayerTokenInfo fromToken(JsonWebToken token){
        String playerName = token.getClaim(CustomJwtClaims.PLAYER_NAME.getName());
        String playerId = token.getClaim(CustomJwtClaims.PLAYER_ID.getName());
        String gameId = token.getClaim(CustomJwtClaims.GAME_ID.getName());

        return new PlayerTokenInfo(playerName, playerId, gameId);
    }
}
