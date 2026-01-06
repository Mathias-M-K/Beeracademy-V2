package dk.mathiaskofod.services.auth;

import dk.mathiaskofod.services.auth.models.Roles;
import dk.mathiaskofod.services.auth.models.CustomJwtClaims;
import dk.mathiaskofod.domain.game.player.Player;
import io.smallrye.jwt.build.Jwt;
import jakarta.enterprise.context.ApplicationScoped;

import java.time.Duration;
import java.util.HashSet;
import java.util.List;

@ApplicationScoped
public class AuthService {

    private static final String ISSUER = "https://example.com/issuer";

    public String createPlayerClientToken(Player player, String gameId) {
        return Jwt.issuer(ISSUER)
                .subject(player.name())
                .groups(new HashSet<>(List.of(Roles.PLAYER_ROLE)))
                .claim(CustomJwtClaims.GAME_ID.getName(), gameId)
                .claim(CustomJwtClaims.PLAYER_NAME.getName(), player.name())
                .claim(CustomJwtClaims.PLAYER_ID.getName(), player.id())
                .expiresIn(Duration.ofHours(5))
                .sign();
    }

    public String createGameClientToken(String gameId) {
        return Jwt.issuer(ISSUER)
                .subject(gameId)
                .groups(new HashSet<>(List.of(Roles.GAME_ROLE)))
                .claim(CustomJwtClaims.GAME_ID.getName(), gameId)
                .expiresIn(Duration.ofHours(5))
                .sign();
    }


}
