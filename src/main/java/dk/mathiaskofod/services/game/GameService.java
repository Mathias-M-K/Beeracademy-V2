package dk.mathiaskofod.services.game;

import dk.mathiaskofod.api.game.models.CreateGameRequest;
import dk.mathiaskofod.services.game.exceptions.GameNotFoundException;
import dk.mathiaskofod.services.game.game.id.generator.IdGenerator;
import dk.mathiaskofod.services.game.game.id.generator.models.GameId;
import dk.mathiaskofod.services.player.PlayerConnectionService;
import dk.mathiaskofod.services.player.exeptions.PlayerNotFoundException;
import dk.mathiaskofod.services.player.models.Player;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.*;

@ApplicationScoped
public class GameService {

    @Inject
    PlayerConnectionService playerConnectionService;

    private final Map<GameId, Game> games = new HashMap<>();

    public GameId createGame(CreateGameRequest createGameRequest) {
        return createGame(createGameRequest.name(), createGameRequest.playerNames());
    }

    public GameId createGame(String name, List<String> playerNames) {

        List<Player> players = playerNames.stream()
                .map(Player::create)
                .toList();

        GameId gameId = IdGenerator.generateGameId();

        Game game = new Game(name, gameId, players);
        games.put(gameId, game);

        return gameId;
    }

    public List<Game> getGames() {
        return games.values().stream().toList();
    }

    public Game getGame(GameId gameId){
        if(games.containsKey(gameId)){
            return games.get(gameId);
        } else {
            throw new GameNotFoundException(gameId);
        }
    }

    public Player getPlayer(GameId gameId, String playerId){
        return getGame(gameId).getPlayers().stream()
                .filter(player -> player.id().equals(playerId))
                .findFirst()
                .orElseThrow(() -> new PlayerNotFoundException(playerId, gameId));
    }
}
