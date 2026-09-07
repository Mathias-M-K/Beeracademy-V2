package dk.mathiaskofod.api.events;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.RETURNS_SELF;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import dk.mathiaskofod.common.dto.party.PartyIdDto;
import dk.mathiaskofod.services.event.publisher.SseEventPublisher;
import dk.mathiaskofod.services.event.publisher.models.ConnectionEvent;
import dk.mathiaskofod.services.event.publisher.models.PlayerConnectionEvent;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.sse.OutboundSseEvent;
import jakarta.ws.rs.sse.Sse;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class SseEventStreamTest {

    SseEventStream sseEventStream;
    SseEventPublisher sseEventPublisher;
    Sse sse;
    OutboundSseEvent.Builder eventBuilder;

    private static final String PARTY_ID = "123456789";
    private static final String OTHER_PARTY_ID = "987654321";
    private static final String PLAYER_ID = "ABCDEF123456";

    @BeforeEach
    void setUp() {
        sseEventPublisher = new SseEventPublisher();

        eventBuilder = mock(OutboundSseEvent.Builder.class, RETURNS_SELF);
        // RETURNS_SELF cannot answer build(), whose return type is not the builder; Mutiny drops a null item
        when(eventBuilder.build()).thenReturn(mock(OutboundSseEvent.class));

        sse = mock(Sse.class);
        when(sse.newEventBuilder()).thenReturn(eventBuilder);

        sseEventStream = new SseEventStream();
        sseEventStream.sseEventPublisher = sseEventPublisher;
        sseEventStream.serverSentEvent = sse;
    }

    /**
     * Subscribes to the endpoint's stream and collects the outbound events it emits. The underlying
     * BroadcastProcessor emits on the publishing thread, so anything published afterwards has arrived by the time
     * publish returns.
     */
    private List<OutboundSseEvent> subscribe(String partyId) {
        List<OutboundSseEvent> received = new ArrayList<>();
        sseEventStream
                .streamPlayerReleases(new PartyIdDto(partyId))
                .subscribe()
                .with(received::add);
        return received;
    }

    @DisplayName("A connection event of the subscribed party is emitted on the stream")
    @Test
    void emitsConnectionEventOfSubscribedParty() {
        // Arrange
        List<OutboundSseEvent> received = subscribe(PARTY_ID);

        // Act
        sseEventPublisher.publishNewConnectionEvent(PARTY_ID, PLAYER_ID, ConnectionEvent.RELEASED);

        // Assert
        assertEquals(1, received.size());
    }

    @DisplayName("The outbound event is named after the connection event and carries the payload as JSON")
    @Test
    void buildsOutboundEventFromTheConnectionEvent() {
        // Arrange
        subscribe(PARTY_ID);

        // Act
        sseEventPublisher.publishNewConnectionEvent(PARTY_ID, PLAYER_ID, ConnectionEvent.CONNECTED);

        // Assert
        verify(eventBuilder).name(ConnectionEvent.CONNECTED.toString());
        verify(eventBuilder).mediaType(MediaType.APPLICATION_JSON_TYPE);
        verify(eventBuilder).data(new PlayerConnectionEvent(PARTY_ID, PLAYER_ID, ConnectionEvent.CONNECTED));
        verify(eventBuilder).build();
    }

    @DisplayName("A subscriber only sees the events of the party it asked for")
    @Test
    void doesNotEmitEventsOfAnotherParty() {
        // Arrange
        List<OutboundSseEvent> received = subscribe(PARTY_ID);

        // Act
        sseEventPublisher.publishNewConnectionEvent(OTHER_PARTY_ID, PLAYER_ID, ConnectionEvent.DISCONNECTED);

        // Assert
        assertTrue(received.isEmpty(), "The stream is scoped to a single party");
    }

    @DisplayName("The party ID is taken normalized, so a dashed ID subscribes to the same party")
    @Test
    void acceptsADashedPartyId() {
        // Arrange
        List<OutboundSseEvent> received = subscribe("123-456-789");

        // Act
        sseEventPublisher.publishNewConnectionEvent(PARTY_ID, PLAYER_ID, ConnectionEvent.RELEASED);

        // Assert
        assertEquals(1, received.size(), "'123-456-789' and '123456789' are the same party");
    }
}
