package dk.mathiaskofod.services.game;

import dk.mathiaskofod.domain.game.Game;
import dk.mathiaskofod.domain.game.GameImpl;
import dk.mathiaskofod.domain.game.events.emitter.GameEventEmitterImpl;
import dk.mathiaskofod.domain.game.models.Chug;
import dk.mathiaskofod.services.game.exceptions.GameNotFoundException;
import dk.mathiaskofod.services.game.id.generator.IdGenerator;
import dk.mathiaskofod.domain.game.models.GameId;
import dk.mathiaskofod.services.game.exceptions.PlayerNotFoundException;
import dk.mathiaskofod.domain.game.player.Player;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.*;

@ApplicationScoped
public class GameService {

    @Inject
    GameEventEmitterImpl gameEventEmitterImpl;

    private final Map<GameId, Game> games = new HashMap<>();

    public GameId createGame(String name, List<String> playerNames) {

        List<Player> players = playerNames.stream()
                .map(Player::create)
                .toList();

        GameId gameId = IdGenerator.generateGameId();

        GameImpl game = new GameImpl(name, gameId, players, gameEventEmitterImpl);
        games.put(gameId, game);

        return gameId;
    }

    public Game getGame(GameId gameId) {

        if (!games.containsKey(gameId)) {
            throw new GameNotFoundException(gameId);
        }

        return games.get(gameId);
    }

    public Player getPlayer(GameId gameId, String playerId) {
        return getGame(gameId).getPlayers().stream()
                .filter(player -> player.id().equals(playerId))
                .findFirst()
                .orElseThrow(() -> new PlayerNotFoundException(playerId, gameId));
    }

    public Player getCurrentPlayer(GameId gameId) {
        return getGame(gameId).getCurrentPlayer();
    }

    public void drawCard(long elapsedTime, GameId gameId) {
        getGame(gameId).drawCard(elapsedTime);
    }

    public void registerChug(Chug chug, GameId gameId) {
        getGame(gameId).registerChug(chug);
    }

    public void startGame(GameId gameId) {
        getGame(gameId).startGame();
    }

    public void endGame(GameId gameId){
        getGame(gameId).endGame();
    }

    public void pauseGame(GameId gameId) {
        getGame(gameId).pauseGame();
    }

    public void resumeGame(GameId gameId){
        getGame(gameId).resumeGame();
    }
}
