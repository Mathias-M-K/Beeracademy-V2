package dk.mathiaskofod.websocket;

import dk.mathiaskofod.services.auth.models.Roles;
import dk.mathiaskofod.services.auth.models.TokenInfo;
import dk.mathiaskofod.services.game.GameClientConnectionService;
import io.quarkus.websockets.next.*;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import lombok.extern.slf4j.Slf4j;
import org.eclipse.microprofile.jwt.JsonWebToken;


@Slf4j
@RolesAllowed(Roles.GAME_ROLE)
@WebSocket(path = "/client")
public class GameClientWebsocket {

    @Inject
    WebSocketConnection connection;

    @Inject
    JsonWebToken jwt;

    @Inject
    GameClientConnectionService gameClientConnectionService;

    @OnOpen
    void onOpen(){
        TokenInfo tokenInfo = TokenInfo.fromToken(jwt);

        gameClientConnectionService.registerConnection(tokenInfo.gameId(), connection.id());
    }

    @OnClose
    void onClose(){
        log.warn("Client disconnected");
    }

    @OnTextMessage
    void onMessage(String message){
        log.info("Client message!");
    }

}
