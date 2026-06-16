package dk.mathiaskofod.websocket.lobby;

import dk.mathiaskofod.services.auth.models.Role;
import dk.mathiaskofod.services.auth.models.TokenInfo;
import dk.mathiaskofod.services.session.LobbyClientSessionManager;
import dk.mathiaskofod.services.session.LobbyParticipantSessionManager;
import dk.mathiaskofod.services.session.WebsocketSessionManager;
import dk.mathiaskofod.services.session.envelopes.WebsocketEnvelope;
import io.quarkus.security.Authenticated;
import io.quarkus.websockets.next.*;
import jakarta.inject.Inject;
import lombok.extern.slf4j.Slf4j;
import org.eclipse.microprofile.jwt.JsonWebToken;

@Slf4j
@WebSocket(path = "/ws/lobby")
@Authenticated
public class LobbyWebsocket {

    @Inject
    JsonWebToken jwt;

    @Inject
    LobbyClientSessionManager lobbyClientSessionManager;

    @Inject
    LobbyParticipantSessionManager lobbyParticipantSessionManager;

    @Inject
    WebSocketConnection connection;

    @OnOpen
    public void onOpen() {
        TokenInfo tokenInfo = new TokenInfo(jwt);
        getSessionManager().onNewConnection(connection.id(), tokenInfo);
    }

    @OnClose
    public void onClose(CloseReason closeReason) {
        TokenInfo tokenInfo = new TokenInfo(jwt);
        getSessionManager().onConnectionClosed(tokenInfo, closeReason);
    }

    @OnTextMessage
    public void onMessage(WebsocketEnvelope<?> message) {
        TokenInfo tokenInfo = new TokenInfo(jwt);
        getSessionManager().onMessage(tokenInfo, message);
    }

    private WebsocketSessionManager getSessionManager() {
        TokenInfo tokenInfo = new TokenInfo(jwt);
        return tokenInfo.getRole() == Role.PLAYER_CLIENT ? lobbyParticipantSessionManager : lobbyClientSessionManager;
    }
}
