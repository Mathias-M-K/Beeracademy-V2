package dk.mathiaskofod.services.environment;

import dk.mathiaskofod.services.environment.models.Environment;
import jakarta.enterprise.context.ApplicationScoped;
import org.eclipse.microprofile.config.inject.ConfigProperty;

@ApplicationScoped
public class EnvironmentService {

    @ConfigProperty(name = "env")
    String environment;

    public Environment getEnvironment() {
        return Environment.fromString(environment);
    }
}
