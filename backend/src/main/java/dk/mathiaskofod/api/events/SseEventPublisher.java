package dk.mathiaskofod.api.events;

import dk.mathiaskofod.api.events.models.PlayerReleaseEvent;
import io.smallrye.mutiny.Multi;
import io.smallrye.mutiny.operators.multi.processors.BroadcastProcessor;
import jakarta.enterprise.context.ApplicationScoped;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@ApplicationScoped
public class SseEventPublisher {

    private final BroadcastProcessor<PlayerReleaseEvent> playerReleases = BroadcastProcessor.create();

    public Multi<PlayerReleaseEvent> playerReleaseStream(String playerId) {
        return playerReleases.filter(playerReleaseEvent -> playerReleaseEvent.playerId().equals(playerId));
    }
}
