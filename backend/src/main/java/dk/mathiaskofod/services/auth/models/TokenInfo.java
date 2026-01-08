package dk.mathiaskofod.services.auth.models;

import dk.mathiaskofod.services.auth.exceptions.TokenException;
import org.eclipse.microprofile.jwt.JsonWebToken;

import java.util.Optional;

public class TokenInfo {
    private final String gameId;
    private final String playerId;

    public TokenInfo(JsonWebToken token) {
        this.gameId = token.getClaim(CustomJwtClaims.GAME_ID.getName());
        this.playerId = token.getClaim(CustomJwtClaims.PLAYER_ID.getName());

        if (gameId == null) {
            throw new TokenException("No Game-ID found in token", 500);
        }
    }

    public String getGameId() {
        return gameId;
    }

    public String getPlayerId() {

        return Optional.ofNullable(playerId)
                .orElseThrow(() -> new TokenException("Token doesn't contain Player-ID", 500));
    }


}
