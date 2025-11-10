package dk.mathiaskofod.services.auth;

import dk.mathiaskofod.services.auth.models.Token;
import dk.mathiaskofod.services.auth.models.CustomJwtClaims;
import dk.mathiaskofod.services.game.game.id.generator.models.GameId;
import dk.mathiaskofod.services.player.models.Player;
import io.smallrye.jwt.build.Jwt;
import jakarta.enterprise.context.ApplicationScoped;

import java.time.Duration;
import java.util.HashSet;
import java.util.List;

@ApplicationScoped
public class AuthService {

    public Token createToken(Player player, GameId gameId) {
        String playerToken = Jwt.issuer("https://example.com/issuer")
                .subject(player.name())
                .groups(new HashSet<>(List.of("Player")))
                .claim(CustomJwtClaims.GAME_ID.getName(), gameId.id())
                .claim(CustomJwtClaims.PLAYER_NAME.getName(), player.name())
                .claim(CustomJwtClaims.PLAYER_ID.getName(), player.id())
                .expiresIn(Duration.ofHours(5))
                .sign();

        return new Token(playerToken);
    }


}
