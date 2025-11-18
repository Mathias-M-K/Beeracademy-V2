package dk.mathiaskofod.services.lobby;

import dk.mathiaskofod.api.game.models.CreateGameRequest;
import dk.mathiaskofod.api.game.models.GameDto;
import dk.mathiaskofod.api.game.models.GameIdDto;
import dk.mathiaskofod.api.game.models.PlayerDto;
import dk.mathiaskofod.domain.game.Game;
import dk.mathiaskofod.domain.game.player.Player;
import dk.mathiaskofod.services.auth.models.Token;
import dk.mathiaskofod.services.game.GameService;
import dk.mathiaskofod.domain.game.models.GameId;
import dk.mathiaskofod.services.session.events.game.dto.GameClientSessionManager;
import dk.mathiaskofod.services.session.events.game.dto.GameSession;
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

    public GameIdDto createGame(CreateGameRequest createGameRequest) {
        GameId gameId = gameService.createGame(createGameRequest.name(), createGameRequest.playerNames());
        return GameIdDto.fromGameId(gameId);
    }

    public GameDto getGame(GameId gameId) {

        Game game = gameService.getGame(gameId);

        Optional<GameSession> gameSession = gameClientSessionManager.getSession(gameId);

        return gameSession.map(
                        session -> GameDto.create(game, session, createPlayerDtoS(game.getPlayers())))
                .orElseGet(
                        () -> GameDto.create(game, createPlayerDtoS(game.getPlayers())));

    }

    public List<PlayerDto> getPlayersInGame(GameId gameId) {
        Game game = gameService.getGame(gameId);
        return createPlayerDtoS(game.getPlayers());
    }

    public Token claimGame(GameId gameId) {
        return gameClientSessionManager.claimGame(gameId);
    }

    public Token claimPlayer(GameId gameId, String playerId) {
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
