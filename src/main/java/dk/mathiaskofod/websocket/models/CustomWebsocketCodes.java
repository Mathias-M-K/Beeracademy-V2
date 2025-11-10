package dk.mathiaskofod.websocket.models;

public enum CustomWebsocketCodes {
    SESSION_NOT_FOUND(4000);

    private final int statusCode;
    CustomWebsocketCodes(int statusCode) {
        this.statusCode = statusCode;
    }

    public int getCode(){
        return statusCode;
    }
}
