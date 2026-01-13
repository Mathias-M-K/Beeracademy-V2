package dk.mathiaskofod.websocket;

import dk.mathiaskofod.providers.exceptions.mappers.ExceptionResponse;
import dk.mathiaskofod.services.auth.models.Role;
import dk.mathiaskofod.services.auth.models.TokenInfo;
import dk.mathiaskofod.services.game.exceptions.GameNotFoundException;
import dk.mathiaskofod.services.session.GameClientSessionManager;
import dk.mathiaskofod.services.session.PlayerClientSessionManager;
import dk.mathiaskofod.services.session.envelopes.WebsocketEnvelope;
import dk.mathiaskofod.websocket.models.CustomWebsocketCodes;
import io.quarkus.security.Authenticated;
import io.quarkus.security.identity.SecurityIdentity;
import io.quarkus.websockets.next.*;
import jakarta.inject.Inject;
import lombok.extern.slf4j.Slf4j;
import org.eclipse.microprofile.jwt.JsonWebToken;

@Slf4j
@WebSocket(path = "/ws/game")
@Authenticated
public class GameWebsocket {

    @Inject
    JsonWebToken jwt;

    @Inject
    SecurityIdentity securityIdentity;

    @Inject
    WebSocketConnection connection;

    @Inject
    PlayerClientSessionManager playerClientSessionManager;

    @Inject
    GameClientSessionManager gameClientSessionManager;

    @OnOpen
    public void onNewWebsocketConnection(){
        getManager().onNewConnection(connection.id(), new TokenInfo(jwt));
    }

    @OnClose
    public void onWebsocketConnectionClosed(CloseReason reason){
        if(reason.getCode() == CustomWebsocketCodes.SESSION_NOT_FOUND.getCode()){
            return;
        }

        getManager().onConnectionClosed(new TokenInfo(jwt));
    }

    @OnTextMessage
    public void onTextMessage(WebsocketEnvelope message){
        getManager().onMessage(new TokenInfo(jwt), message);
    }

    @OnError
    public void onError(RuntimeException e){
        String cause = e.getCause() == null ? "" : e.getCause().getClass().getSimpleName();
        ExceptionResponse response = new ExceptionResponse(e.getClass().getSimpleName(),cause,e.getMessage());
        log.warn("Websocket error for connection {}: {}", connection.id(), response);
        connection.sendTextAndAwait(response);

        if(e instanceof GameNotFoundException){
            connection.closeAndAwait(new CloseReason(CustomWebsocketCodes.SESSION_NOT_FOUND.getCode()));
        }
    }

    private WebsocketSessionManager getManager(){
        Role role = Role.getRoleFromSecurityIdentity(securityIdentity);

        switch (role) {
            case GAME_CLIENT -> {
                return gameClientSessionManager;
            }
            case PLAYER_CLIENT -> {
                return playerClientSessionManager;
            }
            default ->
                    throw new IllegalStateException("Unexpected value: " + Role.getRoleFromSecurityIdentity(securityIdentity));
        }
    }



}
