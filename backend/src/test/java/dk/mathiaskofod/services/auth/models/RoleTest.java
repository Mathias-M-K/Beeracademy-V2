package dk.mathiaskofod.services.auth.models;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import dk.mathiaskofod.services.auth.exceptions.RoleNotFoundException;
import java.util.Set;
import org.eclipse.microprofile.jwt.JsonWebToken;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class RoleTest {

    private JsonWebToken tokenWithGroups(Set<String> groups) {
        JsonWebToken token = mock(JsonWebToken.class);
        when(token.getGroups()).thenReturn(groups);
        return token;
    }

    @DisplayName("A game-client group resolves to GAME_CLIENT")
    @Test
    void resolvesGameClient() {
        // Arrange
        JsonWebToken token = tokenWithGroups(Set.of("GAME_CLIENT"));

        // Act
        Role role = Role.fromJsonWebToken(token);

        // Assert
        assertEquals(Role.GAME_CLIENT, role);
    }

    @DisplayName("A player-client group resolves to PLAYER_CLIENT")
    @Test
    void resolvesPlayerClient() {
        // Arrange
        JsonWebToken token = tokenWithGroups(Set.of("PLAYER_CLIENT"));

        // Act
        Role role = Role.fromJsonWebToken(token);

        // Assert
        assertEquals(Role.PLAYER_CLIENT, role);
    }

    @DisplayName("A token without a recognized role group is rejected")
    @Test
    void unknownRoleThrows() {
        // Arrange
        JsonWebToken token = tokenWithGroups(Set.of("SOMETHING"));

        // Act & Assert
        assertThrows(RoleNotFoundException.class, () -> Role.fromJsonWebToken(token));
    }
}
