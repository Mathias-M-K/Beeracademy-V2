package dk.mathiaskofod.services.auth;

import dk.mathiaskofod.services.auth.models.CustomJwtClaims;
import dk.mathiaskofod.services.auth.models.Role;
import dk.mathiaskofod.services.game.id.generator.IdGenerator;
import io.smallrye.jwt.build.Jwt;
import jakarta.enterprise.context.ApplicationScoped;
import java.time.Duration;
import java.util.HashSet;
import java.util.List;
import org.eclipse.microprofile.config.inject.ConfigProperty;

@ApplicationScoped
public class AuthenticationService {

    public static final Duration TOKEN_DURATION = Duration.ofHours(5);

    @ConfigProperty(name = "mp.jwt.verify.issuer")
    private String issuer;

    public String createPlayerClientToken(String playerName, String partyId, String playerId) {
        return Jwt.issuer(issuer)
                .subject(playerName)
                .groups(new HashSet<>(List.of(Role.PLAYER_CLIENT.toString())))
                .claim(CustomJwtClaims.PARTY_ID.getName(), partyId)
                .claim(CustomJwtClaims.PLAYER_ID.getName(), playerId)
                .expiresIn(TOKEN_DURATION)
                .sign();
    }

    public String createPlayerClientToken(String playerName, String partyId) {
        String id = IdGenerator.generatePlayerId();
        return createPlayerClientToken(playerName, partyId, id);
    }

    public String createGameClientToken(String gameName, String partyId) {
        return Jwt.issuer(issuer)
                .subject(gameName)
                .groups(new HashSet<>(List.of(Role.GAME_CLIENT.toString())))
                .claim(CustomJwtClaims.PARTY_ID.getName(), partyId)
                .expiresIn(TOKEN_DURATION)
                .sign();
    }

    public String createGameClientToken(String gameName) {
        String id = IdGenerator.generatePartyId();
        return createGameClientToken(gameName, id);
    }
}
