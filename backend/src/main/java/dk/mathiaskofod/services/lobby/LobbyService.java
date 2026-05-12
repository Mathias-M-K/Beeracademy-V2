package dk.mathiaskofod.services.lobby;

import dk.mathiaskofod.api.game.models.CreateGameRequest;
import dk.mathiaskofod.common.dto.game.GameDto;
import dk.mathiaskofod.common.dto.player.PlayerDto;
import dk.mathiaskofod.common.dto.session.SessionDto;
import dk.mathiaskofod.domain.game.Game;
import dk.mathiaskofod.domain.game.player.Player;
import dk.mathiaskofod.services.auth.AuthService;
import dk.mathiaskofod.services.game.GameService;
import dk.mathiaskofod.services.session.exceptions.ResourceClaimException;
import dk.mathiaskofod.services.session.repository.Session;
import dk.mathiaskofod.services.session.repository.SessionRegistry;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.util.List;

@ApplicationScoped
public class LobbyService {

    @Inject
    GameService gameService;

    @Inject
    AuthService authService;

    @Inject
    SessionRegistry sessionRegistry;

    public String createGame(CreateGameRequest createGameRequest) {

        List<Player> newPlayers = createGameRequest.players().stream()
                .map(createPlayerDto -> Player.create(
                        createPlayerDto.playerName(), createPlayerDto.sipsInABeer(), createPlayerDto.canDrawChugCard()))
                .toList();

        return gameService.createGame(createGameRequest.name(), newPlayers);
    }

    public GameDto getGame(String gameId) {

        Game game = gameService.getGame(gameId);

        SessionDto gameSession =
                sessionRegistry.getSession(gameId).map(SessionDto::create).orElseGet(SessionDto::createEmpty);

        List<PlayerDto> playerDtos = getPlayerDtos(game);

        return GameDto.create(game, gameSession, playerDtos);
    }

    private List<PlayerDto> getPlayerDtos(Game game) {
        return game.getPlayers().stream()
                .map(player -> {
                    SessionDto playerSessionDto = sessionRegistry
                            .getSession(player.id())
                            .map(SessionDto::create)
                            .orElseGet(SessionDto::createEmpty);

                    return PlayerDto.create(player, playerSessionDto);
                })
                .toList();
    }

    public List<PlayerDto> getPlayerDtos(String gameId) {
        Game game = gameService.getGame(gameId);
        return getPlayerDtos(game);
    }

    public String claimGame(String gameId) {

        if (!gameService.gameExists(gameId)) {
            throw new ResourceClaimException("Game does not exist");
        }

        if (sessionRegistry.getSession(gameId).isPresent()) {
            String msg = String.format("The game with id %s is already claimed.", gameId);
            throw new ResourceClaimException(msg);
        }

        sessionRegistry.registerSession(new Session(gameId));

        return authService.createGameClientToken(gameId);
    }

    public String claimPlayer(String gameId, String playerId) {

        if (!gameService.gameExists(gameId)) {
            throw new ResourceClaimException("Game does not exist");
        }

        if (sessionRegistry.getSession(playerId).isPresent()) {
            String msg =
                    String.format("Player with ID: %s, from game: %s, has already been claimed.", playerId, gameId);
            throw new ResourceClaimException(msg);
        }

        Player player = gameService.getPlayer(gameId, playerId);

        sessionRegistry.registerSession(new Session(playerId));

        return authService.createPlayerClientToken(player, gameId);
    }
}
