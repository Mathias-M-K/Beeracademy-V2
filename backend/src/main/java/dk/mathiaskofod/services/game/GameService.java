package dk.mathiaskofod.services.game;

import dk.mathiaskofod.domain.game.Game;
import dk.mathiaskofod.domain.game.GameImpl;
import dk.mathiaskofod.domain.game.GameSnapshot;
import dk.mathiaskofod.domain.game.events.emitter.GameEventEmitterImpl;
import dk.mathiaskofod.domain.game.models.Chug;
import dk.mathiaskofod.domain.game.player.Player;
import dk.mathiaskofod.domain.game.reports.GameReport;
import dk.mathiaskofod.domain.game.reports.PlayerReport;
import dk.mathiaskofod.domain.game.timer.TimeReport;
import dk.mathiaskofod.domain.game.timer.TimerReports;
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

    private final Map<String, GameSnapshot> games = new HashMap<>();

    public String createGame(String name, List<Player> players) {

        String gameId = IdGenerator.generateGameId();

        GameImpl game = new GameImpl(name, gameId, players, gameEventEmitterImpl);
        games.put(gameId, GameSnapshot.of(game));

        return gameId;
    }

    public boolean checkGameExists(String gameId) {
        return games.containsKey(gameId);
    }

    public Game getGame(String gameId) {

        if (!games.containsKey(gameId)) {
            throw new GameNotFoundException(gameId);
        }
        GameSnapshot snapshot = games.get(gameId);
        return new GameImpl(snapshot, gameEventEmitterImpl);
    }

    public Player getPlayer(String gameId, String playerId) {
        return getGame(gameId).getPlayers().stream()
                .filter(player -> player.id().equals(playerId))
                .findFirst()
                .orElseThrow(() -> new PlayerNotFoundException(playerId, gameId));
    }

    public Player getCurrentPlayer(String gameId) {
        return getGame(gameId).getNextToDraw();
    }

    public void drawCard(long clientDurationMillis, String gameId) {
        Game game = getGame(gameId);
        long serverDurationMillis = game.getPlayerTimer().getActiveDuration().toMillis();
        long diff = Math.abs(clientDurationMillis - serverDurationMillis);
        log.info("Client reported duration: {} ms, Server recorded duration: {} ms, diff: {} ms", clientDurationMillis, serverDurationMillis, diff);
        game.drawCard(clientDurationMillis);
        saveGame(game);
    }

    public void registerChug(Chug chug, String gameId) {
        Game game = getGame(gameId);
        game.registerChug(chug);
        saveGame(game);
    }

    public void startGame(String gameId) {
        Game game = getGame(gameId);
        game.startGame();
        saveGame(game);
    }

    public void endGame(String gameId){
        Game game = getGame(gameId);
        game.endGame();
        saveGame(game);
    }

    public void pauseGame(String gameId) {
        Game game = getGame(gameId);
        game.pauseGame();
        saveGame(game);
    }

    public void resumeGame(String gameId){
        Game game = getGame(gameId);
        game.resumeGame();
        saveGame(game);
    }

    public GameReport getGameReport(String gameId) {
        Game game = getGame(gameId);
        return GameReport.create(game.getPlayers());
    }

    public List<PlayerReport> getPlayerReports(String gameId) {
        Game game = getGame(gameId);
        return PlayerReport.create(game.getPlayers());
    }

    public TimerReports getTimeReport(String gameId) {
        Game game = getGame(gameId);
        return new TimerReports(
                TimeReport.createReport(game.getGameTimer()),
                TimeReport.createReport(game.getPlayerTimer())
        );
    }

    private void saveGame(Game game) {
        games.put(game.getGameId(), GameSnapshot.of(game));
    }
}
