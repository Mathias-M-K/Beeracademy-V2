package dk.mathiaskofod.services.session;

import dk.mathiaskofod.services.lobby.exceptions.LobbyNotFoundException;
import dk.mathiaskofod.services.lobby.models.Lobby;
import dk.mathiaskofod.services.lobby.models.LobbyParticipant;
import dk.mathiaskofod.services.session.envelopes.WebsocketEnvelope;
import dk.mathiaskofod.services.session.repository.Session;

public abstract class AbstractLobbySessionManager extends AbstractSessionManager {

    protected void broadcastToLobby(String lobbyId, WebsocketEnvelope<?> envelope) {

        Lobby lobby = lobbyService.getLobby(lobbyId);

        Session lobbyClientSession =
                sessionRegistry.getSession(lobbyId).orElseThrow(() -> new LobbyNotFoundException(lobbyId));

        lobby.getParticipants().stream()
                .map(LobbyParticipant::id)
                .forEach(sessionId -> sendMessage(sessionId, envelope));

        sendMessage(lobbyClientSession.getSessionId(), envelope);
    }
}
