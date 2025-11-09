package dk.mathiaskofod.api;

import jakarta.ws.rs.ApplicationPath;
import jakarta.ws.rs.core.Application;
import org.eclipse.microprofile.openapi.annotations.OpenAPIDefinition;
import org.eclipse.microprofile.openapi.annotations.info.Info;

@ApplicationPath("/api")
@OpenAPIDefinition(
        info = @Info(
                title = "Beeracademy Backend",
                version = "1.0.0",
                description = "Backend API for Beeracademy application"

        )
)
public class ApiApplication extends Application {
}
