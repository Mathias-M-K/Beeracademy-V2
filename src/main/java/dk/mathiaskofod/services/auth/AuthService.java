package dk.mathiaskofod.services.auth;

import dk.mathiaskofod.services.auth.models.Roles;
import dk.mathiaskofod.services.auth.models.Token;
import dk.mathiaskofod.services.auth.models.CustomJwtClaims;
import dk.mathiaskofod.services.game.id.generator.models.GameId;
import dk.mathiaskofod.services.player.models.Player;
import io.smallrye.jwt.build.Jwt;
import jakarta.enterprise.context.ApplicationScoped;

import java.time.Duration;
import java.util.HashSet;
import java.util.List;

@ApplicationScoped
public class AuthService {

    private static final String ISSUER = "https://example.com/issuer";

    public Token createPlayerClientToken(Player player, GameId gameId) {
        String playerClientToken = Jwt.issuer(ISSUER)
                .subject(player.name())
                .groups(new HashSet<>(List.of(Roles.PLAYER_ROLE)))
                .claim(CustomJwtClaims.GAME_ID.getName(), gameId.id())
                .claim(CustomJwtClaims.PLAYER_NAME.getName(), player.name())
                .claim(CustomJwtClaims.PLAYER_ID.getName(), player.id())
                .expiresIn(Duration.ofHours(5))
                .sign();

        return new Token(playerClientToken);
    }

    public Token createGameClientToken(GameId gameId) {
        String gameClientToken = Jwt.issuer(ISSUER)
                .subject(gameId.humanReadableId())
                .groups(new HashSet<>(List.of(Roles.GAME_ROLE)))
                .claim(CustomJwtClaims.GAME_ID.getName(), gameId.id())
                .expiresIn(Duration.ofHours(5))
                .sign();

        return new Token(gameClientToken);
    }


}
