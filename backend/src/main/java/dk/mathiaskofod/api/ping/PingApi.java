package dk.mathiaskofod.api.ping;

import dk.mathiaskofod.api.ping.models.Pong;
import dk.mathiaskofod.services.environment.EnvironmentService;
import io.smallrye.common.annotation.NonBlocking;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

@Path("/ping")
@Tag(name = "Ping API", description = "API endpoint for health check and application info")
public class PingApi {

    @Inject
    EnvironmentService environmentService;

    @ConfigProperty(name = "quarkus.application.name", defaultValue = "unknown")
    String applicationName;

    @GET
    @NonBlocking
    @Operation(summary = "Ping the application", description = "Returns application name and environment info")
    public Pong ping() {
        return Pong.create(applicationName, environmentService.getEnvironment());
    }
}
