package dk.mathiaskofod.services.lobby;

import dk.mathiaskofod.api.game.models.CreateGameRequest;
import dk.mathiaskofod.api.game.models.GameDto;
import dk.mathiaskofod.api.game.models.PlayerDto;
import dk.mathiaskofod.domain.game.Game;
import dk.mathiaskofod.api.game.models.GameIdDto;
import dk.mathiaskofod.domain.game.player.Player;
import dk.mathiaskofod.services.game.GameService;
import dk.mathiaskofod.services.session.game.GameClientSessionManager;
import dk.mathiaskofod.services.session.game.GameSession;
import dk.mathiaskofod.services.session.player.PlayerSession;
import dk.mathiaskofod.services.session.player.PlayerClientSessionManager;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class LobbyService {

    @Inject
    GameService gameService;

    @Inject
    GameClientSessionManager gameClientSessionManager;

    @Inject
    PlayerClientSessionManager playerClientSessionManager;

    public String createGame(CreateGameRequest createGameRequest) {
        return gameService.createGame(createGameRequest.name(), createGameRequest.playerNames());

    }

    public GameDto getGame(String gameId) {

        Game game = gameService.getGame(gameId);

        Optional<GameSession> gameSession = gameClientSessionManager.getSession(gameId);

        return gameSession
                .map(session -> GameDto.create(game, session, createPlayerDtoS(game.getPlayers())))
                .orElseGet(() -> GameDto.create(game, createPlayerDtoS(game.getPlayers())));

    }

    public List<PlayerDto> getPlayersInGame(String gameId) {
        Game game = gameService.getGame(gameId);
        return createPlayerDtoS(game.getPlayers());
    }

    public String claimGame(String gameId) {
        return gameClientSessionManager.claimGame(gameId);
    }

    public String claimPlayer(String gameId, String playerId) {
        return playerClientSessionManager.claimPlayer(gameId, playerId);
    }

    private List<PlayerDto> createPlayerDtoS(List<Player> players) {

        return players.stream()
                .map(player -> {
                    Optional<PlayerSession> playerSessionOpt = playerClientSessionManager.getSession(player.id());
                    return playerSessionOpt.map(
                                    session -> PlayerDto.create(player, session))
                            .orElseGet(
                                    () -> PlayerDto.create(player, null));
                })
                .toList();
    }


}
