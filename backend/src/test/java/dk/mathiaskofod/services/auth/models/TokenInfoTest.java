package dk.mathiaskofod.services.auth.models;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import dk.mathiaskofod.services.auth.exceptions.TokenException;
import java.util.List;
import java.util.Set;
import org.eclipse.microprofile.jwt.JsonWebToken;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class TokenInfoTest {

    private JsonWebToken gameClientToken(String gameId, String playerId, String name) {
        JsonWebToken token = mock(JsonWebToken.class);
        when(token.getName()).thenReturn(name);
        when(token.getGroups()).thenReturn(Set.copyOf(List.of(Role.GAME_CLIENT.toString())));
        when(token.<String>getClaim(CustomJwtClaims.GAME_ID.getName())).thenReturn(gameId);
        when(token.<String>getClaim(CustomJwtClaims.PLAYER_ID.getName())).thenReturn(playerId);
        return token;
    }

    @DisplayName("A game-client token exposes its game id as the client id")
    @Test
    void gameClientTokenInfo() {
        // Arrange
        JsonWebToken token = gameClientToken("game-1", null, "Host");

        // Act
        TokenInfo info = new TokenInfo(token);

        // Assert
        assertEquals("Host", info.getName());
        assertEquals("game-1", info.getGameId());
        assertEquals(Role.GAME_CLIENT, info.getRole());
        assertEquals("game-1", info.getClientId());
    }

    @DisplayName("A player-client token exposes its player id as the client id")
    @Test
    void playerClientTokenInfo() {
        // Arrange
        JsonWebToken token = mock(JsonWebToken.class);
        when(token.getName()).thenReturn("Bob");
        when(token.getGroups()).thenReturn(Set.copyOf(List.of(Role.PLAYER_CLIENT.toString())));
        when(token.<String>getClaim(CustomJwtClaims.GAME_ID.getName())).thenReturn("game-1");
        when(token.<String>getClaim(CustomJwtClaims.PLAYER_ID.getName())).thenReturn("player-1");

        // Act
        TokenInfo info = new TokenInfo(token);

        // Assert
        assertEquals("player-1", info.getPlayerId());
        assertEquals("player-1", info.getClientId());
    }

    @DisplayName("A token without a game id is rejected")
    @Test
    void missingGameIdThrows() {
        // Arrange
        JsonWebToken token = mock(JsonWebToken.class);
        when(token.getGroups()).thenReturn(Set.copyOf(List.of(Role.GAME_CLIENT.toString())));
        when(token.<String>getClaim(CustomJwtClaims.GAME_ID.getName())).thenReturn(null);

        // Act & Assert
        assertThrows(TokenException.class, () -> new TokenInfo(token));
    }

    @DisplayName("Reading a missing player id throws")
    @Test
    void missingPlayerIdThrows() {
        // Arrange
        TokenInfo info = new TokenInfo(gameClientToken("game-1", null, "Host"));

        // Act & Assert
        assertThrows(TokenException.class, info::getPlayerId);
    }
}
