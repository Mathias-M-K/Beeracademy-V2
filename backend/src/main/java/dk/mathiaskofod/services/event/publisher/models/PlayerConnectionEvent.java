package dk.mathiaskofod.services.event.publisher.models;

import org.eclipse.microprofile.openapi.annotations.media.Schema;

public record PlayerConnectionEvent(
        String partyId,

        @Schema(required = true)
        String playerId,
        ConnectionEvent connectionEvent) {}
