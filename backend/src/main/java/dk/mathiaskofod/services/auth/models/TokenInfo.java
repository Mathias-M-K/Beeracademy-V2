package dk.mathiaskofod.services.auth.models;

import dk.mathiaskofod.services.auth.exceptions.TokenException;

import java.util.Optional;

import lombok.Getter;
import org.eclipse.microprofile.jwt.JsonWebToken;

public class TokenInfo {

    @Getter
    private final String name;

    @Getter
    private final String partyId;

    @Getter
    private final Role role;

    private final String playerId;

    public TokenInfo(JsonWebToken token) {
        this.name = token.getName();
        this.partyId = token.getClaim(CustomJwtClaims.PARTY_ID.getName());
        this.playerId = token.getClaim(CustomJwtClaims.PLAYER_ID.getName());
        this.role = Role.fromJsonWebToken(token);

        if (partyId == null) {
            throw new TokenException("No Party-ID found in token", 403);
        }
        if (role == Role.PLAYER_CLIENT && playerId == null) {
            throw new TokenException("No Player-ID found in token", 403);
        }
    }

    public String getPlayerId() {
        return Optional.ofNullable(playerId)
                .orElseThrow(() -> new TokenException("Game client has no Player-ID", 403));
    }

    public Optional<String> findPlayerId() {
        return Optional.ofNullable(playerId);
    }

    public String getClientId() {
        return switch (role) {
            case GAME_CLIENT -> this.partyId;
            case PLAYER_CLIENT -> this.playerId;
        };
    }
}
