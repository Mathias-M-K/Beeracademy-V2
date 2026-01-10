package dk.mathiaskofod.services.lobby;

import dk.mathiaskofod.api.game.models.CreateGameRequest;
import dk.mathiaskofod.common.dto.game.GameDto;
import dk.mathiaskofod.common.dto.player.PlayerDto;
import dk.mathiaskofod.common.dto.session.SessionDto;
import dk.mathiaskofod.domain.game.Game;
import dk.mathiaskofod.domain.game.player.Player;
import dk.mathiaskofod.services.auth.AuthService;
import dk.mathiaskofod.services.game.GameService;
import dk.mathiaskofod.services.session.GameClientSessionManager;
import dk.mathiaskofod.services.session.models.Session;
import dk.mathiaskofod.services.session.PlayerClientSessionManager;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class LobbyService {

    @Inject
    GameService gameService;

    @Inject
    AuthService authService;

    @Inject
    GameClientSessionManager gameClientSessionManager;

    @Inject
    PlayerClientSessionManager playerClientSessionManager;

    public String createGame(CreateGameRequest createGameRequest) {
        return gameService.createGame(createGameRequest.name(), createGameRequest.playerNames());
    }

    public GameDto getGame(String gameId) {

        Game game = gameService.getGame(gameId);

        SessionDto gameSession = gameClientSessionManager.getSession(gameId)
                .map(SessionDto::create)
                .orElseGet(SessionDto::createEmpty);

        List<PlayerDto> playerDtos = getPlayersInGame(gameId);

        return GameDto.create(game, gameSession, playerDtos);

    }


    public List<PlayerDto> getPlayersInGame(String gameId) {
        Game game = gameService.getGame(gameId);

        return game.getPlayers().stream()
                .map(player -> {
                    Optional<Session> playerSessionOpt = playerClientSessionManager.getSession(player.id());
                    return playerSessionOpt.map(
                                    session -> PlayerDto.create(player, session))
                            .orElseGet(
                                    () -> PlayerDto.create(player, null));
                })
                .toList();
    }

    public String claimGame(String gameId) {
        gameClientSessionManager.claimGame(gameId);
        return authService.createGameClientToken(gameId);
    }

    public String claimPlayer(String gameId, String playerId) {
        playerClientSessionManager.claimPlayer(gameId, playerId);

        Player player = gameService.getPlayer(gameId, playerId);

        return authService.createPlayerClientToken(player, gameId);
    }


}
