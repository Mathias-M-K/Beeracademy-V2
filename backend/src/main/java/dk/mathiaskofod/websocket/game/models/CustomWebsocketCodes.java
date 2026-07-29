package dk.mathiaskofod.websocket.game.models;

import org.eclipse.microprofile.openapi.annotations.media.Schema;

@Schema(description = "Custom websocket codes")
public enum CustomWebsocketCodes {
    SESSION_NOT_FOUND(4000),
    LOBBY_NOT_FOUND(4001),
    LOBBY_LEADER_LEFT(4010),
    KICKED(4020),
    TRANSITIONING(4030);

    private final int statusCode;

    CustomWebsocketCodes(int statusCode) {
        this.statusCode = statusCode;
    }

    public int getCode() {
        return statusCode;
    }
}
