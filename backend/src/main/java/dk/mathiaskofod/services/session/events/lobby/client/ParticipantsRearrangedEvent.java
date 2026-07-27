package dk.mathiaskofod.services.session.events.lobby.client;

import dk.mathiaskofod.api.lobby.models.dto.LobbyParticipantDTO;
import dk.mathiaskofod.services.session.models.annotations.EventType;
import java.util.List;

@EventType("PARTICIPANTS_REARRANGED")
public record ParticipantsRearrangedEvent(List<LobbyParticipantDTO> participants) implements LobbyClientEvent {}
