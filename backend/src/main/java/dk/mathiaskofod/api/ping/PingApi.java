package dk.mathiaskofod.api.ping;

import dk.mathiaskofod.api.ping.models.Pong;
import io.smallrye.common.annotation.NonBlocking;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import lombok.extern.slf4j.Slf4j;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

@Slf4j
@Path("/ping")
@Tag(name = "Ping API", description = "API endpoint for health check and application info")
public class PingApi {

    @ConfigProperty(name = "quarkus.application.name", defaultValue = "unknown")
    String applicationName;

    @ConfigProperty(name = "env")
    String environment;

    @GET
    @NonBlocking
    @Operation(summary = "Ping the application", description = "Returns application name and environment info")
    public Pong ping() {
        log.info("Ping ping :)");
        return Pong.create(applicationName, environment);
    }
}
