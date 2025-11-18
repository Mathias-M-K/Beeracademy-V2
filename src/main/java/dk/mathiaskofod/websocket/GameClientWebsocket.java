package dk.mathiaskofod.websocket;

import dk.mathiaskofod.services.auth.models.Roles;
import dk.mathiaskofod.services.auth.models.PlayerTokenInfo;
import dk.mathiaskofod.services.session.events.game.dto.GameClientSessionManager;
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
    GameClientSessionManager gameClientSessionManager;

    @OnOpen
    void onOpen(){
        gameClientSessionManager.registerConnection(PlayerTokenInfo.fromToken(jwt).gameId(), connection.id());
    }

    @OnClose
    void onClose(){
        gameClientSessionManager.registerDisconnect(PlayerTokenInfo.fromToken(jwt).gameId());
    }

    @OnTextMessage
    String onMessage(String message){
        return "Shhh";
    }

}
