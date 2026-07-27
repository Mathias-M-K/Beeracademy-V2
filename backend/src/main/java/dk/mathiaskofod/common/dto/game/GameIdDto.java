package dk.mathiaskofod.common.dto.game;

import jakarta.validation.constraints.Pattern;
import org.eclipse.microprofile.openapi.annotations.media.Schema;
import org.jboss.resteasy.reactive.RestPath;

@Schema()
public record GameIdDto(
        @RestPath @Pattern(regexp = "^[A-Za-z0-9]{9}$", message = "Invalid game ID format") String gameId) {

    public GameIdDto(String gameId) {
        this.gameId = gameId.replace("-", "");
    }
}
