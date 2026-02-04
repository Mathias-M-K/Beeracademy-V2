package dk.mathiaskofod.domain.game.events.emitter;

import dk.mathiaskofod.domain.game.Game;
import dk.mathiaskofod.domain.game.events.*;
import dk.mathiaskofod.domain.game.models.Chug;
import dk.mathiaskofod.domain.game.models.Turn;
import dk.mathiaskofod.domain.game.player.Player;
import dk.mathiaskofod.domain.game.reports.GameReport;
import dk.mathiaskofod.domain.game.reports.PlayerReport;
import dk.mathiaskofod.domain.game.timer.TimeReport;
import dk.mathiaskofod.domain.game.timer.TimerReports;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Event;
import jakarta.inject.Inject;

@ApplicationScoped
public class GameEventEmitterImpl implements GameEventEmitter {

    @Inject
    Event<GameEvent> eventBus;


    /**
     * Emits a StartGameEvent for the given game.
     *
     * @param game the game whose ID will be used as the event payload
     */
    @Override
    public void onStartGame(Game game) {
        eventBus.fire(new StartGameEvent(game.getGameId()));
    }

    /**
     * Emits an EndGameEvent for the given game containing its ID, generated game and player reports, and timer reports.
     *
     * @param game the Game whose state is used to construct the EndGameEvent payload (ID, game/player reports, and timers)
     */
    @Override
    public void onEndGame(Game game) {
        eventBus.fire(new EndGameEvent(
                game.getGameId(),
                GameReport.create(game.getPlayers()),
                PlayerReport.create(game.getPlayers()),
                new TimerReports(
                        TimeReport.createReport(game.getGameTimer()),
                        TimeReport.createReport(game.getPlayerTimer())
                )));
    }

    /**
     * Emits a PauseGameEvent for the specified game, containing the game's ID and current timer reports.
     *
     * The emitted event's payload includes a TimerReports object composed from the game's game timer and player timer.
     *
     * @param game the game being paused
     */
    @Override
    public void onPauseGame(Game game) {
        eventBus.fire(new PauseGameEvent(
                game.getGameId(),
                new TimerReports(
                        TimeReport.createReport(game.getGameTimer()),
                        TimeReport.createReport(game.getPlayerTimer())
                )));
    }

    /**
     * Emit a ResumeGameEvent for the provided game.
     *
     * The emitted event contains the game's ID and a TimerReports bundle composed from
     * the game's game timer and player timer.
     *
     * @param game the game whose ID and timers are used to construct the emitted event
     */
    @Override
    public void onResumeGame(Game game) {
        eventBus.fire(new ResumeGameEvent(
                game.getGameId(),
                new TimerReports(
                        TimeReport.createReport(game.getGameTimer()),
                        TimeReport.createReport(game.getPlayerTimer())
                )));
    }

    /**
     * Emits a DrawCardEvent containing the turn, the involved players, and the game's identifier.
     *
     * @param turn the current turn during which the card was drawn
     * @param previousPlayer the player who acted immediately before the draw
     * @param newPlayer the player who drew the card
     * @param nextPlayer the player who will act after the draw
     * @param game the Game whose ID is included in the emitted event
     */
    @Override
    public void onDrawCard(Turn turn, Player previousPlayer, Player newPlayer, Player nextPlayer, Game game) {
        eventBus.fire(new DrawCardEvent(turn, previousPlayer, newPlayer, nextPlayer, game.getGameId()));
    }

    /**
     * Emits a ChugEvent representing a newly started chug within the given game.
     *
     * @param chug       the chug action or data to include in the event
     * @param chugger    the player who performed the chug
     * @param nextPlayer the player who takes the next turn after the chugger
     * @param game       the game whose identifier will be included in the event
     */
    @Override
    public void onNewChug(Chug chug, Player chugger, Player nextPlayer, Game game) {
        eventBus.fire(new ChugEvent(chug, chugger, nextPlayer, game.getGameId()));
    }
}