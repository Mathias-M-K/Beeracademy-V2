package dk.mathiaskofod.services.auth.models;

import dk.mathiaskofod.services.auth.exceptions.TokenException;
import java.util.Optional;
import lombok.Getter;
import org.eclipse.microprofile.jwt.JsonWebToken;

public class TokenInfo {
    @Getter
    private final String name;

    @Getter
    private final String gameId;

    @Getter
    private final Role role;

    private final String playerId;

    public TokenInfo(JsonWebToken token) {
        this.name = token.getName();
        this.gameId = token.getClaim(CustomJwtClaims.GAME_ID.getName());
        this.playerId = token.getClaim(CustomJwtClaims.PLAYER_ID.getName());
        this.role = Role.fromJsonWebToken(token);

        if (gameId == null) {
            throw new TokenException("No Game-ID found in token", 500);
        }
    }

    public String getPlayerId() {

        return Optional.ofNullable(playerId)
                .orElseThrow(() -> new TokenException("Token doesn't contain Player-ID", 500));
    }
}
