package dk.mathiaskofod.services.event.publisher;

import dk.mathiaskofod.services.event.publisher.models.ConnectionEvent;
import dk.mathiaskofod.services.event.publisher.models.PlayerConnectionEvent;
import io.smallrye.mutiny.Multi;
import io.smallrye.mutiny.operators.multi.processors.BroadcastProcessor;
import jakarta.enterprise.context.ApplicationScoped;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@ApplicationScoped
public class SseEventPublisher {

    private final BroadcastProcessor<PlayerConnectionEvent> playerConnectionEvents = BroadcastProcessor.create();

    //TODO some day we should probably add partyId verification
    public Multi<PlayerConnectionEvent> playerConnectionEventStream(String partyId) {
        return playerConnectionEvents.filter(event -> event.partyId().equals(partyId));
    }

    public void publishNewConnectionEvent(String partyId, String playerId, ConnectionEvent connectionEvent) {
        log.info("Publishing new connection event. PlayerId:{}, connectionEvent:{}", playerId, connectionEvent);

        playerConnectionEvents.onNext(new PlayerConnectionEvent(partyId, playerId, connectionEvent));
    }
}
