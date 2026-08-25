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
import io.quarkus.redis.datasource.RedisDataSource;
import io.quarkus.redis.datasource.value.ValueCommands;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.util.List;
import lombok.extern.slf4j.Slf4j;

@ApplicationScoped
@Slf4j
public class GameService {

    @Inject
    GameEventEmitterImpl gameEventEmitterImpl;

    // TODO introduce cache key prefix
    private final ValueCommands<String, GameSnapshot> gameSnapshots;

    // TODO PostConstruct instead maybe?
    public GameService(RedisDataSource redisDataSource) {
        gameSnapshots = redisDataSource.value(GameSnapshot.class);
    }

    /**
     * Creates the Game for a party.
     *
     * <p>This is the one place where the party id crosses into the domain: the domain knows only about Games, so the
     * party id becomes the game id. The domain deliberately never learns the word "party".
     */
    public void createGame(String name, String partyId, List<Player> players) {
        GameImpl game = new GameImpl(name, partyId, players, gameEventEmitterImpl);
        saveGame(game);
    }

    public boolean gameExists(String partyId) {

        try {
            return gameSnapshots.get(partyId) != null;
        } catch (NullPointerException npe) {
            return false;
        }
    }

    public Game getGame(String partyId) {

        GameSnapshot snapshot = gameSnapshots.get(partyId);

        if (snapshot == null) {
            throw new GameNotFoundException(partyId);
        }

        return new GameImpl(snapshot, gameEventEmitterImpl);
    }

    public Player getPlayer(String partyId, String playerId) {
        return getGame(partyId).getPlayers().stream()
                .filter(player -> player.id().equals(playerId))
                .findFirst()
                .orElseThrow(() -> new PlayerNotFoundException(playerId, partyId));
    }

    public Player getCurrentPlayer(String partyId) {
        return getGame(partyId).getNextToDraw();
    }

    public void drawCard(long clientDurationMillis, String partyId) {
        Game game = getGame(partyId);
        long serverDurationMillis = game.getPlayerTimer().getActiveDuration().toMillis();
        long diff = Math.abs(clientDurationMillis - serverDurationMillis);
        log.info(
                "Client reported duration: {} ms, Server recorded duration: {} ms, diff: {} ms",
                clientDurationMillis,
                serverDurationMillis,
                diff);
        game.drawCard(clientDurationMillis);
        saveGame(game);
    }

    public void registerChug(Chug chug, String partyId) {
        Game game = getGame(partyId);
        game.registerChug(chug);
        saveGame(game);
    }

    public void startGame(String partyId) {
        Game game = getGame(partyId);
        game.startGame();
        saveGame(game);
    }

    public void endGame(String partyId) {
        Game game = getGame(partyId);
        game.endGame();
        saveGame(game);
    }

    public void pauseGame(String partyId) {
        Game game = getGame(partyId);
        game.pauseGame();
        saveGame(game);
    }

    public void resumeGame(String partyId) {
        Game game = getGame(partyId);
        game.resumeGame();
        saveGame(game);
    }

    public GameReport getGameReport(String partyId) {
        Game game = getGame(partyId);
        return GameReport.create(game.getPlayers());
    }

    public List<PlayerReport> getPlayerReports(String partyId) {
        Game game = getGame(partyId);
        return PlayerReport.create(game.getPlayers());
    }

    public TimerReports getTimeReport(String partyId) {
        Game game = getGame(partyId);
        return new TimerReports(
                TimeReport.createReport(game.getGameTimer()), TimeReport.createReport(game.getPlayerTimer()));
    }

    private void saveGame(Game game) {
        gameSnapshots.set(game.getGameId(), GameSnapshot.of(game));
    }
}
