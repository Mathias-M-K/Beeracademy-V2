package dk.mathiaskofod.services.event.publisher;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import dk.mathiaskofod.services.event.publisher.models.ConnectionEvent;
import dk.mathiaskofod.services.event.publisher.models.PlayerConnectionEvent;
import io.smallrye.mutiny.subscription.Cancellable;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class SseEventPublisherTest {

    SseEventPublisher sseEventPublisher;

    private static final String PARTY_ID = "123456789";
    private static final String OTHER_PARTY_ID = "987654321";
    private static final String PLAYER_ID = "ABCDEF123456";

    @BeforeEach
    void setUp() {
        sseEventPublisher = new SseEventPublisher();
    }

    /**
     * Subscribes to a party's stream and collects what it receives. The underlying BroadcastProcessor emits on the
     * publishing thread, so events published after this call have landed in the list by the time publish returns.
     */
    private List<PlayerConnectionEvent> collect(String partyId) {
        List<PlayerConnectionEvent> received = new ArrayList<>();
        sseEventPublisher.playerConnectionEventStream(partyId).subscribe().with(received::add);
        return received;
    }

    @DisplayName("A published connection event reaches a subscriber of that party")
    @Test
    void publishedEventReachesPartySubscriber() {
        // Arrange
        List<PlayerConnectionEvent> received = collect(PARTY_ID);

        // Act
        sseEventPublisher.publishNewConnectionEvent(PARTY_ID, PLAYER_ID, ConnectionEvent.CONNECTED);

        // Assert
        assertEquals(1, received.size());
        assertEquals(PARTY_ID, received.getFirst().partyId());
        assertEquals(PLAYER_ID, received.getFirst().playerId());
        assertEquals(ConnectionEvent.CONNECTED, received.getFirst().connectionEvent());
    }

    @DisplayName("The stream is scoped to its party — events for another party are filtered out")
    @Test
    void eventsForAnotherPartyAreFiltered() {
        // Arrange
        List<PlayerConnectionEvent> received = collect(PARTY_ID);

        // Act
        sseEventPublisher.publishNewConnectionEvent(OTHER_PARTY_ID, PLAYER_ID, ConnectionEvent.RELEASED);

        // Assert
        assertTrue(received.isEmpty(), "A subscriber should only see the events of the party it subscribed to");
    }

    @DisplayName("Every subscriber of a party receives the same event")
    @Test
    void everySubscriberOfAPartyReceivesTheEvent() {
        // Arrange
        List<PlayerConnectionEvent> firstSubscriber = collect(PARTY_ID);
        List<PlayerConnectionEvent> secondSubscriber = collect(PARTY_ID);

        // Act
        sseEventPublisher.publishNewConnectionEvent(PARTY_ID, PLAYER_ID, ConnectionEvent.DISCONNECTED);

        // Assert
        assertEquals(1, firstSubscriber.size());
        assertEquals(1, secondSubscriber.size());
        assertEquals(ConnectionEvent.DISCONNECTED, firstSubscriber.getFirst().connectionEvent());
        assertEquals(ConnectionEvent.DISCONNECTED, secondSubscriber.getFirst().connectionEvent());
    }

    @DisplayName("Events published before a subscription are not replayed to it")
    @Test
    void eventsPublishedBeforeSubscriptionAreNotReplayed() {
        // Arrange
        sseEventPublisher.publishNewConnectionEvent(PARTY_ID, PLAYER_ID, ConnectionEvent.CONNECTED);

        // Act
        List<PlayerConnectionEvent> received = collect(PARTY_ID);

        // Assert
        assertTrue(received.isEmpty(), "The stream is live, not replayed — a late subscriber misses earlier events");
    }

    @DisplayName("A cancelled subscription stops receiving events")
    @Test
    void cancelledSubscriptionStopsReceivingEvents() {
        // Arrange
        List<PlayerConnectionEvent> received = new ArrayList<>();
        Cancellable subscription =
                sseEventPublisher.playerConnectionEventStream(PARTY_ID).subscribe().with(received::add);

        // Act
        subscription.cancel();
        sseEventPublisher.publishNewConnectionEvent(PARTY_ID, PLAYER_ID, ConnectionEvent.RELEASED);

        // Assert
        assertTrue(received.isEmpty(), "A client that disconnected should no longer be delivered events");
    }
}
