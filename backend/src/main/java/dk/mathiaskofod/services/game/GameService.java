package dk.mathiaskofod.services.game;

import dk.mathiaskofod.domain.game.Game;
import dk.mathiaskofod.domain.game.GameImpl;
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

    /**
     * Resumes the game identified by the given gameId.
     *
     * @param gameId the id of the game to resume
     * @throws GameNotFoundException if no game exists with the given id
     */
    public void resumeGame(String gameId){
        getGame(gameId).resumeGame();
    }

    /**
     * Create a summary report for the specified game.
     *
     * @param gameId the identifier of the game to report on
     * @return a GameReport constructed from the game's players
     */
    public GameReport getGameReport(String gameId) {
        Game game = getGame(gameId);
        return GameReport.create(game.getPlayers());
    }

    /**
     * Produce a collection of player performance reports for the specified game.
     *
     * @param gameId the identifier of the game whose players will be reported
     * @return a list of PlayerReport objects, one for each player in the game
     */
    public List<PlayerReport> getPlayerReports(String gameId) {
        Game game = getGame(gameId);
        return PlayerReport.create(game.getPlayers());
    }

    /**
     * Create a TimerReports aggregating the game's overall timer report and the player timer report.
     *
     * @param gameId the identifier of the game to generate reports for
     * @return a TimerReports containing the game's time report and the player time report
     * @throws GameNotFoundException if no game exists for the provided `gameId`
     */
    public TimerReports getTimeReport(String gameId) {
        Game game = getGame(gameId);
        return new TimerReports(
                TimeReport.createReport(game.getGameTimer()),
                TimeReport.createReport(game.getPlayerTimer())
        );
    }
}