package dk.mathiaskofod.services.event.publisher.models;

public record PlayerReleaseEvent(String partyId, String playerId, ConnectionEvent connectionEvent) {}
