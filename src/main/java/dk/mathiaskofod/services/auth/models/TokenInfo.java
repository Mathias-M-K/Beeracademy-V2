package dk.mathiaskofod.services.auth.models;

import dk.mathiaskofod.services.game.id.generator.models.GameId;
import org.eclipse.microprofile.jwt.JsonWebToken;

public record TokenInfo(String playerName, String playerId, GameId gameId) {

    public static TokenInfo fromToken(JsonWebToken token){
        String playerName = token.getClaim(CustomJwtClaims.PLAYER_NAME.getName());
        String playerId = token.getClaim(CustomJwtClaims.PLAYER_ID.getName());
        String gameIdStr = token.getClaim(CustomJwtClaims.GAME_ID.getName());
        GameId gameId = new GameId(gameIdStr);

        return new TokenInfo(playerName, playerId,gameId);
    }
}
