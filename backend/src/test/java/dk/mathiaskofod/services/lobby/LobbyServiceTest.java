package dk.mathiaskofod.services.lobby;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

import dk.mathiaskofod.api.game.models.CreateGameRequest;
import dk.mathiaskofod.api.game.models.CreatePlayerDto;
import dk.mathiaskofod.common.dto.game.GameDto;
import dk.mathiaskofod.common.dto.player.PlayerDto;
import dk.mathiaskofod.domain.game.Game;
import dk.mathiaskofod.domain.game.models.GameState;
import dk.mathiaskofod.domain.game.player.Player;
import dk.mathiaskofod.domain.game.timer.Timer;
import dk.mathiaskofod.services.auth.AuthService;
import dk.mathiaskofod.services.game.GameService;
import dk.mathiaskofod.services.game.exceptions.PlayerNotFoundException;
import dk.mathiaskofod.services.session.exceptions.ResourceClaimException;
import dk.mathiaskofod.services.session.repository.Session;
import dk.mathiaskofod.services.session.repository.SessionRegistry;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class LobbyServiceTest {

    @Mock
    GameService gameServiceMock;

    @Mock
    AuthService authServiceMock;

    @Mock
    SessionRegistry sessionRegistryMock;

    LobbyService lobbyService;

    Player player1;
    Player player2;

    @BeforeEach
    void setUp() {
        lobbyService = new LobbyService();
        lobbyService.gameService = gameServiceMock;
        lobbyService.authService = authServiceMock;
        lobbyService.sessionRegistry = sessionRegistryMock;

        player1 = Player.create("Alice", 2, true);
        player2 = Player.create("Bob", 3, true);
    }

    @DisplayName("Create game with valid request")
    @Test
    void createGameWithValidRequest() {
        // Arrange
        String gameName = "Test game";
        CreatePlayerDto player1Dto = new CreatePlayerDto("Alice", 2, true);
        CreatePlayerDto player2Dto = new CreatePlayerDto("Bob", 3, false);
        CreateGameRequest request = new CreateGameRequest(gameName, List.of(player1Dto, player2Dto));

        // Act
        lobbyService.createGame(request);

        // Assert
        verify(gameServiceMock, times(1))
                .createGame(
                        eq(gameName),
                        argThat(players -> players.size() == 2
                                && players.getFirst().name().equals("Alice")
                                && players.get(1).name().equals("Bob")));
    }

    @DisplayName("Get game also returns session details")
    @Test
    void getGameDetails() {
        // Arrange
        String gameId = "123";
        Game gameMock = mock(Game.class);
        Session session = new Session(gameId);

        when(gameServiceMock.getGame(gameId)).thenReturn(gameMock);
        when(gameMock.getGameId()).thenReturn(gameId);
        when(gameMock.getName()).thenReturn("Test Game");
        when(gameMock.getPlayers()).thenReturn(List.of(player1, player2));
        when(gameMock.getNextToDraw()).thenReturn(player1);
        when(gameMock.getNextAfter()).thenReturn(player2);
        when(gameMock.getGameTimer()).thenReturn(new Timer());
        when(gameMock.getPlayerTimer()).thenReturn(new Timer());
        when(gameMock.getGameState()).thenReturn(GameState.AWAITING_START);
        when(sessionRegistryMock.getSession(any())).thenReturn(Optional.of(session));

        // Act
        GameDto gameDto = lobbyService.getGame(gameId);

        // Assert
        assertThat(gameDto.id(), is(gameId));
        assertThat(gameDto.players().size(), is(2));
        verify(sessionRegistryMock, times(3)).getSession(any()); // 1 for game, 2 for players
    }

    @DisplayName("Get player DTOs for a game")
    @Test
    void getPlayerDtos() {
        // Arrange
        String gameId = "123";
        Game gameMock = mock(Game.class);
        when(gameServiceMock.getGame(gameId)).thenReturn(gameMock);
        when(gameMock.getPlayers()).thenReturn(List.of(player1, player2));
        when(sessionRegistryMock.getSession(player1.id())).thenReturn(Optional.empty());
        when(sessionRegistryMock.getSession(player2.id())).thenReturn(Optional.of(mock(Session.class)));

        // Act
        List<PlayerDto> playerDtos = lobbyService.getPlayerDtos(gameId);

        // Assert
        assertThat(playerDtos.size(), is(2));
        assertThat(playerDtos.get(0).name(), is(player1.name()));
        assertThat(playerDtos.get(1).name(), is(player2.name()));
        assertThat(playerDtos.get(0).session().isClaimed(), is(false));
        assertThat(playerDtos.get(1).session().isClaimed(), is(true));
    }

    @DisplayName("Claim game successfully")
    @Test
    void claimGameSuccessfully() {
        // Arrange
        String gameId = "123";
        String token = "jwt-token";
        when(gameServiceMock.gameExists(gameId)).thenReturn(true);
        when(sessionRegistryMock.getSession(gameId)).thenReturn(Optional.empty());
        when(authServiceMock.createGameClientToken(gameId)).thenReturn(token);

        // Act
        String resultToken = lobbyService.claimGame(gameId);

        // Assert
        assertThat(resultToken, is(token));
        verify(sessionRegistryMock, times(1)).registerSession(any(Session.class));
    }

    @DisplayName("Claim game fails when game does not exist")
    @Test
    void claimGameFailsWhenGameDoesNotExist() {
        // Arrange
        String gameId = "non-existent";
        when(gameServiceMock.gameExists(gameId)).thenReturn(false);

        // Act & Assert
        Assertions.assertThrows(ResourceClaimException.class, () -> lobbyService.claimGame(gameId));
    }

    @DisplayName("Claim game fails when game is already claimed")
    @Test
    void claimGameFailsWhenAlreadyClaimed() {
        // Arrange
        String gameId = "123";
        when(gameServiceMock.gameExists(gameId)).thenReturn(true);
        when(sessionRegistryMock.getSession(gameId)).thenReturn(Optional.of(mock(Session.class)));

        // Act & Assert
        Assertions.assertThrows(ResourceClaimException.class, () -> lobbyService.claimGame(gameId));
    }

    @DisplayName("Claim player successfully")
    @Test
    void claimPlayerSuccessfully() {
        // Arrange
        String gameId = "123";
        String playerId = "p1";
        String token = "player-token";
        when(gameServiceMock.gameExists(gameId)).thenReturn(true);
        when(sessionRegistryMock.getSession(playerId)).thenReturn(Optional.empty());
        when(gameServiceMock.getPlayer(gameId, playerId)).thenReturn(player1);
        when(authServiceMock.createPlayerClientToken(player1, gameId)).thenReturn(token);

        // Act
        String resultToken = lobbyService.claimPlayer(gameId, playerId);

        // Assert
        assertThat(resultToken, is(token));
        verify(sessionRegistryMock, times(1)).registerSession(any(Session.class));
    }

    @DisplayName("Claim player fails when game does not exist")
    @Test
    void claimPlayerFailsWhenGameDoesNotExist() {
        // Arrange
        String gameId = "non-existent";
        String playerId = "p1";
        when(gameServiceMock.gameExists(gameId)).thenReturn(false);

        // Act & Assert
        Assertions.assertThrows(ResourceClaimException.class, () -> lobbyService.claimPlayer(gameId, playerId));
    }

    @DisplayName("Claim player fails when player is already claimed")
    @Test
    void claimPlayerFailsWhenAlreadyClaimed() {
        // Arrange
        String gameId = "123";
        String playerId = "p1";
        when(gameServiceMock.gameExists(gameId)).thenReturn(true);
        when(sessionRegistryMock.getSession(playerId)).thenReturn(Optional.of(mock(Session.class)));

        // Act & Assert
        Assertions.assertThrows(ResourceClaimException.class, () -> lobbyService.claimPlayer(gameId, playerId));
    }

    @DisplayName("Claim player fails when player does not exist")
    @Test
    void claimPlayerFailsWhenPlayerDoesNotExist() {
        // Arrange
        String gameId = "123";
        String playerId = "non-existent-player";
        when(gameServiceMock.gameExists(gameId)).thenReturn(true);
        when(sessionRegistryMock.getSession(playerId)).thenReturn(Optional.empty());
        when(gameServiceMock.getPlayer(gameId, playerId)).thenThrow(new PlayerNotFoundException(playerId, gameId));

        // Act & Assert
        Assertions.assertThrows(PlayerNotFoundException.class, () -> lobbyService.claimPlayer(gameId, playerId));
    }

    @DisplayName("Create game with no players")
    @Test
    void createGameWithNoPlayers() {
        // Arrange
        String gameName = "Empty game";
        CreateGameRequest request = new CreateGameRequest(gameName, List.of());

        // Act
        lobbyService.createGame(request);

        // Assert
        verify(gameServiceMock, times(1)).createGame(eq(gameName), argThat(List::isEmpty));
    }
}
