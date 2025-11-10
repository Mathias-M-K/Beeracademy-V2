package dk.mathiaskofod.websocket;

import dk.mathiaskofod.services.auth.models.CustomJwtClaims;
import dk.mathiaskofod.services.auth.models.TokenInfo;
import dk.mathiaskofod.services.game.game.id.generator.models.GameId;
import dk.mathiaskofod.services.player.PlayerConnectionService;
import io.quarkus.security.Authenticated;
import io.quarkus.websockets.next.*;
import jakarta.inject.Inject;
import lombok.extern.slf4j.Slf4j;
import org.eclipse.microprofile.jwt.JsonWebToken;
import org.slf4j.MDC;

@Slf4j
@Authenticated
@WebSocket(path = "/player")
public class PlayerConnectionWebsocket {

    @Inject
    JsonWebToken jwt;

    @Inject
    WebSocketConnection connection;

    @Inject
    PlayerConnectionService playerConnectionService;

    @OnOpen(broadcast = true)
    public void onOpen() {

        TokenInfo tokenInfo = TokenInfo.fromToken(jwt);
        String websocketConnId = connection.id();

        String CORRELATION_ID_HEADER = "X-Correlation-ID";
        MDC.put(CORRELATION_ID_HEADER, websocketConnId);
        log.info("Heya");

        playerConnectionService.registerConnection(tokenInfo, websocketConnId);
    }

    @OnClose
    public void onClose() {
        playerConnectionService.registerDisconnect(TokenInfo.fromToken(jwt));
    }

    @OnTextMessage(broadcast = true)
    public void onMessage(String message) {
        TokenInfo tokenInfo = TokenInfo.fromToken(jwt);
        log.info("Received message from {}: {}", tokenInfo.playerName(), message);
    }


}
