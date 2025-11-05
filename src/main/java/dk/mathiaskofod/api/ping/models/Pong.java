package dk.mathiaskofod.api.ping.models;

import lombok.extern.slf4j.Slf4j;

import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;

@Slf4j
public record Pong(String application, ZonedDateTime time, String environment) {

    public static Pong create(String application, String environment){
        ZonedDateTime now = Instant.now().atZone(ZoneId.systemDefault());
        return new Pong(application,now, environment);
    }
}
