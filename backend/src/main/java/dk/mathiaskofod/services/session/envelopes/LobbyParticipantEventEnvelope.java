package dk.mathiaskofod.services.session.envelopes;

import dk.mathiaskofod.services.session.events.lobby.participant.LobbyParticipantEvent;
import dk.mathiaskofod.services.session.models.annotations.Category;

@Category("LOBBY_PARTICIPANT_EVENT")
public record LobbyParticipantEventEnvelope(LobbyParticipantEvent payload)
        implements WebsocketEnvelope<LobbyParticipantEvent> {}
