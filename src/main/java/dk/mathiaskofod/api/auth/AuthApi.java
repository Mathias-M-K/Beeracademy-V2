package dk.mathiaskofod.api.auth;

import dk.mathiaskofod.services.auth.models.Token;
import dk.mathiaskofod.services.auth.AuthService;
import dk.mathiaskofod.services.game.game.id.generator.models.GameId;
import dk.mathiaskofod.services.player.models.Player;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.SecurityContext;
import lombok.extern.slf4j.Slf4j;
import org.eclipse.microprofile.jwt.JsonWebToken;

@Slf4j
@Path("/auth")
public class AuthApi {

    @Inject
    AuthService authService;

    @Inject
    JsonWebToken jwt;

    @GET
    @Path("/permit-all")
    @Produces(MediaType.TEXT_PLAIN)
    public String permitAll(@Context SecurityContext securityContext) {
        return getResponseString(securityContext);
    }

    @GET
    @Path("roles-allowed")
    @RolesAllowed({"User", "Admin"})
    @Produces(MediaType.TEXT_PLAIN)
    public String playersAllowed(@Context SecurityContext securityContext) {
        log.info("GameID claim: {}, playerId: {}", jwt.getClaim("gameId"), jwt.getClaim("playerId"));
        return getResponseString(securityContext);
    }

    @GET
    @Path("token")
    public Token getToken(@QueryParam("game-id") String gameId) {
        Player player = Player.create("Steffen");
        return authService.createToken(player, new GameId("123abc123"));
    }

    private String getResponseString(SecurityContext ctx) {
        String name;
        if (ctx.getUserPrincipal() == null) {
            name = "anonymous";
        } else if (!ctx.getUserPrincipal().getName().equals(jwt.getName())) {
            throw new InternalServerErrorException("Principal and JsonWebToken names do not match");
        } else {
            name = ctx.getUserPrincipal().getName();
        }
        return String.format("hello %s,"
                        + " isHttps: %s,"
                        + " authScheme: %s,"
                        + " hasJWT: %s",
                name, ctx.isSecure(), ctx.getAuthenticationScheme(), hasJwt());
    }

    private boolean hasJwt() {
        return jwt.getClaimNames() != null;
    }
}
