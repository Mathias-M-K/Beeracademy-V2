package dk.mathiaskofod.api.events;

import dk.mathiaskofod.common.dto.party.PartyIdDto;
import dk.mathiaskofod.services.event.publisher.SseEventPublisher;
import dk.mathiaskofod.services.event.publisher.models.PlayerReleaseEvent;
import io.smallrye.mutiny.Multi;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.sse.OutboundSseEvent;
import jakarta.ws.rs.sse.Sse;
import lombok.extern.slf4j.Slf4j;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.media.Content;
import org.eclipse.microprofile.openapi.annotations.media.Schema;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponse;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;
import org.jboss.resteasy.reactive.RestStreamElementType;

@Slf4j
@ApplicationScoped
@Path("/events")
@Tag(name = "Events API", description = "Server-sent event streams for one-way server-to-client notifications")
public class SseEventStream {

    @Inject
    Sse serverSentEvent;

    @Inject
    SseEventPublisher sseEventPublisher;

    @GET
    @Path("/player-connection-events/{partyId}")
    @RestStreamElementType(MediaType.APPLICATION_JSON)
    @Operation(
            summary = "Subscribe to the connection events of a party",
            description =
                    "Opens a server-sent event stream carrying connection-state changes for the players of the given party. The connection stays open until the client disconnects. The stream is scoped to the party but not to a single player: every subscriber receives the events for all players in that party, and a client interested in one player is expected to match on the playerId field of the payload. Each event is named 'player-release' and carries a JSON payload.")
    @APIResponse(
            responseCode = "200",
            description = "Stream opened. Events for every player in the party are delivered as they occur.",
            content =
                    @Content(
                            mediaType = MediaType.SERVER_SENT_EVENTS,
                            schema = @Schema(implementation = PlayerReleaseEvent.class)))
    @APIResponse(
            responseCode = "400",
            description = "The partyId path parameter is missing or is not a 9-character alphanumeric party ID.")
    public Multi<OutboundSseEvent> streamPlayerReleases(@Valid @PathParam("partyId") PartyIdDto partyIdDto) {
        return sseEventPublisher.playerConnectionEventStream(partyIdDto.partyId()).map(this::toSseEvent);
    }

    private OutboundSseEvent toSseEvent(PlayerReleaseEvent event) {
        return serverSentEvent
                .newEventBuilder()
                .name(event.connectionEvent().toString())
                .mediaType(MediaType.APPLICATION_JSON_TYPE)
                .data(event)
                .build();
    }
}
