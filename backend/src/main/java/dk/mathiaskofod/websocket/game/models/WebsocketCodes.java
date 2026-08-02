package dk.mathiaskofod.websocket.game.models;

import org.eclipse.microprofile.openapi.annotations.media.Schema;

@Schema(description = "Custom websocket codes")
public enum WebsocketCodes {
    GOING_AWAY(1001),
    ABNORMAL_CLOSURE(1006),
    SERVICE_RESTART(1012),
    TRY_AGAIN_LATER(1013),
    SESSION_NOT_FOUND(4000),
    LOBBY_NOT_FOUND(4001),
    GAME_NOT_FOUND(4002),
    LOBBY_LEADER_LEFT(4010),
    KICKED(4020),
    TRANSITIONING(4030);

    private final int statusCode;

    WebsocketCodes(int statusCode) {
        this.statusCode = statusCode;
    }

    public int getCode() {
        return statusCode;
    }
}
