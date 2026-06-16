package dk.mathiaskofod.services.session.envelopes;

import dk.mathiaskofod.services.session.actions.lobby.participant.LobbyParticipantAction;
import dk.mathiaskofod.services.session.models.annotations.Category;

@Category("LOBBY_PARTICIPANT_ACTION")
public record LobbyParticipantActionEnvelope(LobbyParticipantAction payload)
        implements WebsocketEnvelope<LobbyParticipantAction> {}
