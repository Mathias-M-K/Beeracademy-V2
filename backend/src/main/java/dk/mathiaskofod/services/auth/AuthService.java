package dk.mathiaskofod.services.auth;

import dk.mathiaskofod.domain.game.player.Player;
import dk.mathiaskofod.services.auth.models.CustomJwtClaims;
import dk.mathiaskofod.services.auth.models.Role;
import io.smallrye.jwt.build.Jwt;
import jakarta.enterprise.context.ApplicationScoped;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.time.Duration;
import java.util.HashSet;
import java.util.List;

@ApplicationScoped
public class AuthService {

    @ConfigProperty(name = "mp.jwt.verify.issuer")
    private String issuer;

    public String createPlayerClientToken(Player player, String gameId) {
        return Jwt.issuer(issuer)
                .subject(player.name())
                .groups(new HashSet<>(List.of(Role.PLAYER_CLIENT.toString())))
                .claim(CustomJwtClaims.GAME_ID.getName(), gameId)
                .claim(CustomJwtClaims.PLAYER_NAME.getName(), player.name())
                .claim(CustomJwtClaims.PLAYER_ID.getName(), player.id())
                .expiresIn(Duration.ofHours(5))
                .sign();
    }

    public String createGameClientToken(String gameId) {
        return Jwt.issuer(issuer)
                .subject(gameId)
                .groups(new HashSet<>(List.of(Role.GAME_CLIENT.toString())))
                .claim(CustomJwtClaims.GAME_ID.getName(), gameId)
                .expiresIn(Duration.ofHours(5))
                .sign();
    }


}
