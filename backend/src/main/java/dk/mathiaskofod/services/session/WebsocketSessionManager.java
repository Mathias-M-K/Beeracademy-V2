package dk.mathiaskofod.services.session;

import dk.mathiaskofod.services.auth.models.TokenInfo;
import dk.mathiaskofod.services.session.envelopes.WebsocketEnvelope;
import io.quarkus.websockets.next.CloseReason;

public interface WebsocketSessionManager {

    void onNewConnection(String websocketConnectionId, TokenInfo tokenInfo);

    void onConnectionClosed(TokenInfo tokenInfo, CloseReason closeReason);

    void onMessage(TokenInfo tokenInfo, WebsocketEnvelope<?> message);
}
