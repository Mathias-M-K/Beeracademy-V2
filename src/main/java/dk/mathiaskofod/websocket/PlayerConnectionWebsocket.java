package dk.mathiaskofod.websocket;

import dk.mathiaskofod.services.player.PlayerConnectionService;
import io.quarkus.websockets.next.*;
import jakarta.inject.Inject;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@WebSocket(path="/player/{username}")
public class PlayerConnectionWebsocket {

    @Inject
    WebSocketConnection connection;

    @Inject
    PlayerConnectionService playerConnectionService;

    @OnOpen(broadcast = true)
    public String onOpen() {

        String playerName = connection.pathParam("username");
        String connectionId = connection.id();

        log.info("New connection established for user: {}, Connection-ID: {}", playerName, connectionId);

        //playerConnectionService.registerPlayer(playerName, connectionId);
        return "Welcome " + connection.pathParam("username") + "!";
    }

    @OnClose
    public void onClose() {
        log.warn("Connection closed for user: {}", connection.pathParam("username"));
        connection.broadcast().sendTextAndAwait(connection.pathParam("username"));
    }

    @OnTextMessage(broadcast = true)
    public void onMessage(String message) {
        log.info("Received message from {}: {}", connection.pathParam("username"), message);
    }


}
