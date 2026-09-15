package dk.mathiaskofod.websocket.game.models;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.util.Arrays;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class WebsocketCodeTest {

    @DisplayName("Every websocket close code maps to a distinct numeric code")
    @Test
    void codesAreUnique() {
        // Arrange
        WebsocketCode[] values = WebsocketCode.values();

        // Act
        long distinctCodes = Arrays.stream(values).mapToInt(WebsocketCode::getCode).distinct().count();

        // Assert
        assertEquals(values.length, distinctCodes);
    }

    @DisplayName("Application-defined close codes stay within the 4000-4999 private range")
    @Test
    void applicationCodesUsePrivateRange() {
        // Arrange
        WebsocketCode[] applicationCodes = {
                WebsocketCode.SESSION_NOT_FOUND,
                WebsocketCode.SESSION_OCCUPIED,
                WebsocketCode.LOBBY_NOT_FOUND,
                WebsocketCode.GAME_NOT_FOUND,
                WebsocketCode.LOBBY_LEADER_LEFT,
                WebsocketCode.KICKED,
                WebsocketCode.TRANSITIONING,
                WebsocketCode.UNKNOWN,
                WebsocketCode.PLAYER_RELINQUISHED
        };

        // Act
        long outOfRange = Arrays.stream(applicationCodes)
                .filter(code -> code.getCode() < 4000 || code.getCode() > 4999)
                .count();

        // Assert
        assertEquals(0, outOfRange);
    }
}
