package dk.mathiaskofod.services.session;

import dk.mathiaskofod.api.lobby.models.dto.LobbyDTO;
import dk.mathiaskofod.services.auth.models.TokenInfo;
import dk.mathiaskofod.services.lobby.exceptions.LobbyNotFoundException;
import dk.mathiaskofod.services.lobby.models.LobbyParticipant;
import dk.mathiaskofod.services.session.actions.lobby.common.UpdateSettingsAction;
import dk.mathiaskofod.services.session.envelopes.LobbyParticipantEventEnvelope;
import dk.mathiaskofod.services.session.envelopes.WebsocketEnvelope;
import dk.mathiaskofod.services.session.events.lobby.common.LobbySnapshotEvent;
import dk.mathiaskofod.services.session.events.lobby.common.SettingsUpdatedEvent;
import dk.mathiaskofod.services.session.exceptions.CannotIdentifyPlayerException;
import dk.mathiaskofod.services.session.repository.Session;
import java.util.Collections;
import java.util.List;
import java.util.function.Function;

public abstract class AbstractLobbySessionManager extends AbstractSessionManager {

    protected void applyAndBroadcastSettings(String partyId, String targetParticipantId, UpdateSettingsAction action) {

        lobbyService
                .getLobby(partyId)
                .getParticipant(targetParticipantId)
                .orElseThrow(() -> new CannotIdentifyPlayerException(
                        "Participant ID: " + targetParticipantId + ", didn't match any participants", 400))
                .updateSettings(action.getSipsInABeer(), action.canDrawAce());

        SettingsUpdatedEvent event = SettingsUpdatedEvent.fromAction(targetParticipantId, action);
        broadcastToLobby(partyId, new LobbyParticipantEventEnvelope(event));
    }

    protected void broadcastToLobby(String partyId, WebsocketEnvelope<?> envelope) {
        broadcastToLobby(partyId, envelope, Collections.emptyList());
    }

    protected void broadcastToLobby(String partyId, WebsocketEnvelope<?> envelope, List<String> excluded) {

        Session lobbyClientSession =
                sessionRegistry.getSession(partyId).orElseThrow(() -> new LobbyNotFoundException(partyId));

        lobbyService.getLobby(partyId).getParticipants().stream()
                .filter(LobbyParticipant::isActive)
                .map(LobbyParticipant::getId)
                .filter(id -> !excluded.contains(id))
                .forEach(sessionId -> sendMessage(sessionId, envelope));

        if (!excluded.contains(partyId)) {
            sendMessage(lobbyClientSession.getSessionId(), envelope);
        }
    }

    protected void provideLobbySnapshotToClient(
            TokenInfo tokenInfo, Function<LobbySnapshotEvent, WebsocketEnvelope<?>> envelope) {
        LobbyDTO lobbyState = LobbyDTO.fromLobby(lobbyService.getLobby(tokenInfo.getPartyId()));
        LobbySnapshotEvent lobbySnapshotEvent = new LobbySnapshotEvent(lobbyState);
        sendMessage(tokenInfo.getClientId(), envelope.apply(lobbySnapshotEvent));
    }
}
