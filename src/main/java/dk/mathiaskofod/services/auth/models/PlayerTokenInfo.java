package dk.mathiaskofod.services.auth.models;

import dk.mathiaskofod.domain.game.models.GameId;
import org.eclipse.microprofile.jwt.JsonWebToken;

//FIXME create GameTokenInfo
public record PlayerTokenInfo(String playerName, String playerId, GameId gameId) {

    public static PlayerTokenInfo fromToken(JsonWebToken token){
        String playerName = token.getClaim(CustomJwtClaims.PLAYER_NAME.getName());
        String playerId = token.getClaim(CustomJwtClaims.PLAYER_ID.getName());
        String gameIdStr = token.getClaim(CustomJwtClaims.GAME_ID.getName());
        GameId gameId = new GameId(gameIdStr);

        return new PlayerTokenInfo(playerName, playerId,gameId);
    }
}
