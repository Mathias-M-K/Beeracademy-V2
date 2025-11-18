package dk.mathiaskofod.services.auth.models;

import dk.mathiaskofod.domain.game.models.GameId;
import org.eclipse.microprofile.jwt.JsonWebToken;

public record GameTokenInfo(GameId gameId) {

    public static GameTokenInfo fromToken(JsonWebToken token){
        String gameIdStr = token.getClaim(CustomJwtClaims.GAME_ID.getName());
        GameId gameId = new GameId(gameIdStr);

        return new GameTokenInfo(gameId);
    }
}
