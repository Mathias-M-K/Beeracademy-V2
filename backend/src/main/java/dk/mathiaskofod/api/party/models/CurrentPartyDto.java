package dk.mathiaskofod.api.party.models;

import dk.mathiaskofod.services.auth.models.Role;

public record CurrentPartyDto(Role role, String playerId, PartyDto partyState) {
}
