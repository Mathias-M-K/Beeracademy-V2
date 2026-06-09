package dk.mathiaskofod.services.session;

import dk.mathiaskofod.services.auth.models.TokenInfo;
import dk.mathiaskofod.services.session.envelopes.WebsocketEnvelope;
import jakarta.enterprise.context.ApplicationScoped;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@ApplicationScoped
public class LobbyClientSessionManager extends AbstractLobbySessionManager {

    @Override
    public void onNewConnection(String websocketConnectionId, TokenInfo tokenInfo) {
        log.info("Registering new client connected with websocket connection id: {}", websocketConnectionId);
        sessionRegistry.setConnectionId(tokenInfo.getGameId(), websocketConnectionId);
    }

    @Override
    public void onConnectionClosed(TokenInfo tokenInfo) {}

    @Override
    public void onMessage(TokenInfo tokenInfo, WebsocketEnvelope message) {}
}
