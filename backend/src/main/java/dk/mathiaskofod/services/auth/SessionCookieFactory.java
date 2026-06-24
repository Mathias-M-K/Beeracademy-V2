package dk.mathiaskofod.services.auth;

import dk.mathiaskofod.services.environment.EnvironmentService;
import dk.mathiaskofod.services.environment.models.Environment;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.core.NewCookie;
import java.util.regex.Pattern;

@ApplicationScoped
public class SessionCookieFactory {

    public static final String SESSION_COOKIE_NAME = "session_jwt";

    private static final Pattern JWT_ALLOWED = Pattern.compile("[^A-Za-z0-9._-]");

    @Inject
    EnvironmentService environmentService;

    public NewCookie createSessionCookie(String jwt) {

        String sanitizedJwt = sanitizeJwt(jwt);

        boolean isDev = environmentService.getEnvironment() == Environment.DEV;

        return new NewCookie.Builder(SESSION_COOKIE_NAME)
                .httpOnly(!isDev)
                .secure(!isDev)
                .sameSite(NewCookie.SameSite.LAX)
                .path("/")
                .value(sanitizedJwt)
                .maxAge((int) AuthenticationService.TOKEN_DURATION.getSeconds())
                .build();
    }

    private static String sanitizeJwt(String jwt) {
        if (jwt == null) {
            return "";
        }
        return JWT_ALLOWED.matcher(jwt).replaceAll("");
    }
}
