package dk.mathiaskofod.services.game;

import dk.mathiaskofod.domain.game.Game;
import dk.mathiaskofod.domain.game.GameImpl;
import dk.mathiaskofod.domain.game.events.emitter.GameEventEmitterImpl;
import dk.mathiaskofod.domain.game.models.Chug;
import dk.mathiaskofod.domain.game.player.Player;
import dk.mathiaskofod.services.game.exceptions.GameNotFoundException;
import dk.mathiaskofod.services.game.exceptions.PlayerNotFoundException;
import dk.mathiaskofod.services.game.id.generator.IdGenerator;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import lombok.extern.slf4j.Slf4j;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@ApplicationScoped
@Slf4j
public class GameService {

    @Inject
    GameEventEmitterImpl gameEventEmitterImpl;

    private final Map<String, Game> games = new HashMap<>();

    public String createGame(String name, List<Player> players) {

        String gameId = IdGenerator.generateGameId();

        GameImpl game = new GameImpl(name, gameId, players, gameEventEmitterImpl);
        games.put(gameId, game);

        return gameId;
    }

    public Game getGame(String gameId) {

        if (!games.containsKey(gameId)) {
            throw new GameNotFoundException(gameId);
        }

        return games.get(gameId);
    }

    public Player getPlayer(String gameId, String playerId) {
        return getGame(gameId).getPlayers().stream()
                .filter(player -> player.id().equals(playerId))
                .findFirst()
                .orElseThrow(() -> new PlayerNotFoundException(playerId, gameId));
    }

    public Player getCurrentPlayer(String gameId) {
        return getGame(gameId).getCurrentPlayer();
    }

    public void drawCard(long elapsedTime, String gameId) {
        getGame(gameId).drawCard(elapsedTime);
    }

    public void registerChug(Chug chug, String gameId) {
        getGame(gameId).registerChug(chug);
    }

    public void startGame(String gameId) {
        getGame(gameId).startGame();
    }

    public void endGame(String gameId){
        getGame(gameId).endGame();
        games.remove(gameId);
    }

    public void pauseGame(String gameId) {
        getGame(gameId).pauseGame();
    }

    public void resumeGame(String gameId){
        getGame(gameId).resumeGame();
    }
}
