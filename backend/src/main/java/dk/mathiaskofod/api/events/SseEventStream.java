package dk.mathiaskofod.api.events;

import dk.mathiaskofod.api.events.models.PlayerReleaseEvent;
import dk.mathiaskofod.common.dto.participant.ParticipantIdDto;
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
import org.eclipse.microprofile.openapi.annotations.parameters.Parameter;
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
    @Path("/player-releases/{participant-id}")
    @RestStreamElementType(MediaType.APPLICATION_JSON)
    @Operation(
            summary = "Subscribe to player release events",
            description = "Opens a server-sent event stream that emits an event every time the given player is released. The connection stays open until the client disconnects, and only events for the requested player are delivered. Each event is named 'player-release' and carries a JSON payload.")
    @APIResponse(
            responseCode = "200",
            description = "Stream opened. Events are delivered as they occur.",
            content =
            @Content(
                    mediaType = MediaType.SERVER_SENT_EVENTS,
                    schema = @Schema(implementation = PlayerReleaseEvent.class)))
    @APIResponse(responseCode = "400", description = "The player-id query parameter is missing or blank.")
    public Multi<OutboundSseEvent> streamPlayerReleases(
            @Parameter(
                    description = "The ID of the player to listen for releases on",
                    required = true,
                    example = "a1b2c3d4")
            @Valid
            @PathParam("participant-id")
            ParticipantIdDto playerIdDto) {
        return sseEventPublisher.playerReleaseStream(playerIdDto.id()).map(this::toSseEvent);
    }

    private OutboundSseEvent toSseEvent(PlayerReleaseEvent event) {
        return serverSentEvent
                .newEventBuilder()
                .name("player-release")
                .mediaType(MediaType.APPLICATION_JSON_TYPE)
                .data(event)
                .build();
    }
}
