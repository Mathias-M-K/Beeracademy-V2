package dk.mathiaskofod.services.auth.models;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import dk.mathiaskofod.services.auth.exceptions.TokenException;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import org.eclipse.microprofile.jwt.JsonWebToken;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class TokenInfoTest {

    private JsonWebToken token(Role role, String partyId, String playerId, String name) {
        JsonWebToken token = mock(JsonWebToken.class);
        when(token.getName()).thenReturn(name);
        when(token.getGroups()).thenReturn(Set.copyOf(List.of(role.toString())));
        when(token.<String>getClaim(CustomJwtClaims.PARTY_ID.getName())).thenReturn(partyId);
        when(token.<String>getClaim(CustomJwtClaims.PLAYER_ID.getName())).thenReturn(playerId);
        return token;
    }

    private JsonWebToken gameClientToken(String partyId, String name) {
        return token(Role.GAME_CLIENT, partyId, null, name);
    }

    private JsonWebToken playerClientToken(String partyId, String playerId, String name) {
        return token(Role.PLAYER_CLIENT, partyId, playerId, name);
    }

    @DisplayName("A game-client token exposes its party id as the client id")
    @Test
    void gameClientTokenInfo() {
        // Arrange
        JsonWebToken token = gameClientToken("game-1", "Host");

        // Act
        TokenInfo info = new TokenInfo(token);

        // Assert
        assertEquals("Host", info.getName());
        assertEquals("game-1", info.getPartyId());
        assertEquals(Role.GAME_CLIENT, info.getRole());
        assertEquals("game-1", info.getClientId());
    }

    @DisplayName("A player-client token exposes its player id as the client id")
    @Test
    void playerClientTokenInfo() {
        // Arrange
        JsonWebToken token = playerClientToken("game-1", "player-1", "Bob");

        // Act
        TokenInfo info = new TokenInfo(token);

        // Assert
        assertEquals("player-1", info.getPlayerId());
        assertEquals("player-1", info.getClientId());
    }

    @DisplayName("A token without a party id is rejected")
    @Test
    void missingPartyIdThrows() {
        // Arrange
        JsonWebToken token = gameClientToken(null, "Host");

        // Act & Assert
        TokenException exception = assertThrows(TokenException.class, () -> new TokenInfo(token));
        assertEquals(403, exception.httpStatus);
    }

    @DisplayName("A player-client token without a player id is rejected on construction")
    @Test
    void playerTokenMissingPlayerIdThrows() {
        // Arrange
        JsonWebToken token = playerClientToken("game-1", null, "Bob");

        // Act & Assert
        TokenException exception = assertThrows(TokenException.class, () -> new TokenInfo(token));
        assertEquals(403, exception.httpStatus);
    }

    @DisplayName("A game-client token without a player id is accepted")
    @Test
    void gameTokenMissingPlayerIdIsAccepted() {
        // Arrange
        JsonWebToken token = gameClientToken("game-1", "Host");

        // Act
        TokenInfo info = new TokenInfo(token);

        // Assert
        assertEquals(Role.GAME_CLIENT, info.getRole());
    }

    @DisplayName("Requiring a player id from a game client throws 403")
    @Test
    void gameClientGetPlayerIdThrows() {
        // Arrange
        TokenInfo info = new TokenInfo(gameClientToken("game-1", "Host"));

        // Act & Assert
        TokenException exception = assertThrows(TokenException.class, info::getPlayerId);
        assertEquals(403, exception.httpStatus);
    }

    @DisplayName("Finding the player id of a player client returns it")
    @Test
    void playerClientFindPlayerId() {
        // Arrange
        TokenInfo info = new TokenInfo(playerClientToken("game-1", "player-1", "Bob"));

        // Act
        Optional<String> playerId = info.findPlayerId();

        // Assert
        assertEquals(Optional.of("player-1"), playerId);
    }

    @DisplayName("Finding the player id of a game client returns empty")
    @Test
    void gameClientFindPlayerIdIsEmpty() {
        // Arrange
        TokenInfo info = new TokenInfo(gameClientToken("game-1", "Host"));

        // Act
        Optional<String> playerId = info.findPlayerId();

        // Assert
        assertTrue(playerId.isEmpty());
    }
}
