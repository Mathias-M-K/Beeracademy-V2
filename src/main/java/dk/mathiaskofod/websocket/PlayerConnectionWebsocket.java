package dk.mathiaskofod.websocket;

import dk.mathiaskofod.providers.exeptions.BaseException;
import dk.mathiaskofod.providers.exeptions.mappers.ExceptionResponse;
import dk.mathiaskofod.services.auth.models.TokenInfo;
import dk.mathiaskofod.services.game.exceptions.GameNotFoundException;
import dk.mathiaskofod.services.player.PlayerConnectionService;
import dk.mathiaskofod.services.player.exeptions.PlayerNotFoundException;
import dk.mathiaskofod.services.player.models.ConnectionInfo;
import dk.mathiaskofod.websocket.models.CustomWebsocketCodes;
import io.quarkus.security.Authenticated;
import io.quarkus.security.ForbiddenException;
import io.quarkus.websockets.next.*;
import jakarta.inject.Inject;
import lombok.extern.slf4j.Slf4j;
import org.eclipse.microprofile.jwt.JsonWebToken;


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

        playerConnectionService.registerConnection(tokenInfo, websocketConnId);
    }

    @OnClose
    public void onClose(CloseReason reason) {

        if(reason.getCode() == CustomWebsocketCodes.SESSION_NOT_FOUND.getCode()){
            return;
        }

        playerConnectionService.registerDisconnect(TokenInfo.fromToken(jwt));
    }

    @OnTextMessage(broadcast = true)
    public void onMessage(String message) {
        TokenInfo tokenInfo = TokenInfo.fromToken(jwt);
        log.info("Received message from {}: {}", tokenInfo.playerName(), message);
        playerConnectionService.relinquishPlayer(tokenInfo);
    }

    @OnError
    public void onError(RuntimeException e){
        String cause = e.getCause() == null ? "" : e.getCause().getClass().getSimpleName();
        ExceptionResponse response = new ExceptionResponse(e.getClass().getSimpleName(),cause,e.getMessage());
        connection.sendTextAndAwait(response);
        connection.closeAndAwait(new CloseReason(CustomWebsocketCodes.SESSION_NOT_FOUND.getCode()));
    }


}
