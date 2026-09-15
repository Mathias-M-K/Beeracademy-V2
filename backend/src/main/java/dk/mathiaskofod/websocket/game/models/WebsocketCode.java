package dk.mathiaskofod.websocket.game.models;

import org.eclipse.microprofile.openapi.annotations.media.Schema;

@Schema(description = "All websocket close codes")
public enum WebsocketCode {
    GOING_AWAY(1001),
    ABNORMAL_CLOSURE(1006),
    SERVICE_RESTART(1012),
    TRY_AGAIN_LATER(1013),
    SESSION_NOT_FOUND(4000),
    SESSION_OCCUPIED(4001),
    LOBBY_NOT_FOUND(4002),
    GAME_NOT_FOUND(4003),
    LOBBY_LEADER_LEFT(4010),
    KICKED(4020),
    TRANSITIONING(4030),
    UNKNOWN(4040),
    PLAYER_RELINQUISHED(4050);

    private final int statusCode;

    WebsocketCode(int statusCode) {
        this.statusCode = statusCode;
    }

    public int getCode() {
        return statusCode;
    }
}
