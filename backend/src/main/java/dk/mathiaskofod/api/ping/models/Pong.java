package dk.mathiaskofod.api.ping.models;

import dk.mathiaskofod.services.environment.models.Environment;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public record Pong(String application, ZonedDateTime time, Environment environment) {

    public static Pong create(String application, Environment env) {
        ZonedDateTime now = Instant.now().atZone(ZoneId.systemDefault());
        return new Pong(application, now, env);
    }
}
