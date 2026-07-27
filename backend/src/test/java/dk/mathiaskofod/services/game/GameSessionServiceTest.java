package dk.mathiaskofod.services.game;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import dk.mathiaskofod.domain.game.Game;
import dk.mathiaskofod.domain.game.player.Player;
import dk.mathiaskofod.services.session.exceptions.ResourceClaimException;
import dk.mathiaskofod.services.session.repository.Session;
import dk.mathiaskofod.services.session.repository.SessionRegistry;
import java.util.Collections;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class GameSessionServiceTest {

    @Mock
    GameService gameService;

    @Mock
    SessionRegistry sessionRegistry;

    @InjectMocks
    GameSessionService gameSessionService;

    private static final String GAME_ID = "game-123";
    private static final String PLAYER_ID = "player-p1";

    @Nested
    @DisplayName("claimGame")
    class ClaimGame {

        @DisplayName("registers a session when the game exists and is unclaimed")
        @Test
        void claimGameSuccessfully() {
            // Arrange
            when(gameService.gameExists(GAME_ID)).thenReturn(true);
            when(sessionRegistry.getSession(GAME_ID)).thenReturn(Optional.empty());

            // Act
            gameSessionService.claimGame(GAME_ID);

            // Assert
            verify(sessionRegistry).registerSession(any(Session.class));
        }

        @DisplayName("throws when the game does not exist")
        @Test
        void claimGameGameMissing() {
            // Arrange
            when(gameService.gameExists(GAME_ID)).thenReturn(false);

            // Act & Assert
            assertThrows(ResourceClaimException.class, () -> gameSessionService.claimGame(GAME_ID));
        }

        @DisplayName("throws when the game is already claimed")
        @Test
        void claimGameAlreadyClaimed() {
            // Arrange
            when(gameService.gameExists(GAME_ID)).thenReturn(true);
            when(sessionRegistry.getSession(GAME_ID)).thenReturn(Optional.of(new Session(GAME_ID)));

            // Act & Assert
            assertThrows(ResourceClaimException.class, () -> gameSessionService.claimGame(GAME_ID));
        }
    }

    @Nested
    @DisplayName("claimPlayer")
    class ClaimPlayer {

        @DisplayName("registers a session and returns the player when unclaimed")
        @Test
        void claimPlayerSuccessfully() {
            // Arrange
            Player player = Player.create("Bob", 14, true);
            when(gameService.gameExists(GAME_ID)).thenReturn(true);
            when(sessionRegistry.getSession(PLAYER_ID)).thenReturn(Optional.empty());
            when(gameService.getPlayer(GAME_ID, PLAYER_ID)).thenReturn(player);

            // Act
            Player claimed = gameSessionService.claimPlayer(GAME_ID, PLAYER_ID);

            // Assert
            assertEquals(player, claimed);
            verify(sessionRegistry).registerSession(any(Session.class));
        }

        @DisplayName("throws when the game does not exist")
        @Test
        void claimPlayerGameMissing() {
            // Arrange
            when(gameService.gameExists(GAME_ID)).thenReturn(false);

            // Act & Assert
            assertThrows(ResourceClaimException.class, () -> gameSessionService.claimPlayer(GAME_ID, PLAYER_ID));
        }

        @DisplayName("throws when the player is already claimed")
        @Test
        void claimPlayerAlreadyClaimed() {
            // Arrange
            when(gameService.gameExists(GAME_ID)).thenReturn(true);
            when(sessionRegistry.getSession(PLAYER_ID)).thenReturn(Optional.of(new Session(PLAYER_ID)));

            // Act & Assert
            assertThrows(ResourceClaimException.class, () -> gameSessionService.claimPlayer(GAME_ID, PLAYER_ID));
        }
    }

    @Nested
    @DisplayName("Read models")
    class ReadModels {

        @DisplayName("getPlayerViews returns a view per player in the game")
        @Test
        void getPlayerViewsEmptyGame() {
            // Arrange
            Game game = mock(Game.class);
            when(game.getPlayers()).thenReturn(Collections.emptyList());
            when(gameService.getGame(GAME_ID)).thenReturn(game);

            // Act & Assert
            assertTrue(gameSessionService.getPlayerViews(GAME_ID).isEmpty());
        }
    }
}
