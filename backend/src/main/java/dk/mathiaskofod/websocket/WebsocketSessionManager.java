package dk.mathiaskofod.websocket;

import dk.mathiaskofod.services.auth.models.TokenInfo;
import dk.mathiaskofod.services.session.envelopes.WebsocketEnvelope;

public interface WebsocketSessionManager {

    void onNewConnection(String websocketConnectionId, TokenInfo tokenInfo);
    void onConnectionClosed(TokenInfo tokenInfo);
    void onMessage(TokenInfo tokenInfo, WebsocketEnvelope message);

}

