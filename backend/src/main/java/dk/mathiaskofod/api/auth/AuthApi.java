package dk.mathiaskofod.api.auth;

import io.quarkus.security.Authenticated;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.jwt.JsonWebToken;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

@Path("/auth")
@Tag(name = "Auth API", description = "API endpoint for fetching authentication information")
public class AuthApi {

    @Inject
    JsonWebToken jwt;

    @GET
    @Path("/test")
    @Authenticated
    public Response getAuthentication() {
        return Response.ok().entity(jwt).build();
    }
}
