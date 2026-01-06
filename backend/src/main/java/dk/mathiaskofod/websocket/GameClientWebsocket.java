package dk.mathiaskofod.websocket;

import dk.mathiaskofod.providers.exceptions.mappers.ExceptionResponse;
import dk.mathiaskofod.services.auth.models.GameTokenInfo;
import dk.mathiaskofod.services.auth.models.Roles;

import dk.mathiaskofod.services.game.exceptions.GameNotFoundException;
import dk.mathiaskofod.services.session.game.GameClientSessionManager;
import dk.mathiaskofod.services.session.envelopes.WebsocketEnvelope;
import dk.mathiaskofod.services.session.exceptions.ResourceClaimException;
import dk.mathiaskofod.websocket.models.CustomWebsocketCodes;
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
        gameClientSessionManager.registerConnection(GameTokenInfo.fromToken(jwt).gameId(), connection.id());
    }

    @OnClose
    void onClose(CloseReason reason){

        if(reason.getCode() == CustomWebsocketCodes.SESSION_NOT_FOUND.getCode()){
            return;
        }

        gameClientSessionManager.registerDisconnect(GameTokenInfo.fromToken(jwt).gameId());
    }

    @OnTextMessage
    void onMessage(WebsocketEnvelope message){
        gameClientSessionManager.onMessageReceived(GameTokenInfo.fromToken(jwt).gameId(), message);
    }

    @OnError
    void onError(RuntimeException e){
        String cause = e.getCause() == null ? "" : e.getCause().getClass().getSimpleName();
        ExceptionResponse response = new ExceptionResponse(e.getClass().getSimpleName(),cause,e.getMessage());
        log.warn("Websocket error for connection {}: {}", connection.id(), response);
        connection.sendTextAndAwait(response);

        if(e instanceof GameNotFoundException || e instanceof ResourceClaimException){
            connection.closeAndAwait(new CloseReason(CustomWebsocketCodes.SESSION_NOT_FOUND.getCode()));
        }
    }



}
