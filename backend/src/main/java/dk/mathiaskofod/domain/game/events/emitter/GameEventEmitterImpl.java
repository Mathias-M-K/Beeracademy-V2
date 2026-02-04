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


    @Override
    public void onStartGame(Game game) {
        eventBus.fire(new StartGameEvent(game.getGameId()));
    }

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

    @Override
    public void onPauseGame(Game game) {
        eventBus.fire(new PauseGameEvent(
                game.getGameId(),
                new TimerReports(
                        TimeReport.createReport(game.getGameTimer()),
                        TimeReport.createReport(game.getPlayerTimer())
                )));
    }

    @Override
    public void onResumeGame(Game game) {
        eventBus.fire(new ResumeGameEvent(
                game.getGameId(),
                new TimerReports(
                        TimeReport.createReport(game.getGameTimer()),
                        TimeReport.createReport(game.getPlayerTimer())
                )));
    }

    @Override
    public void onDrawCard(Turn turn, Player previousPlayer, Player newPlayer, Player nextPlayer, Game game) {
        eventBus.fire(new DrawCardEvent(turn, previousPlayer, newPlayer, nextPlayer, game.getGameId()));
    }

    @Override
    public void onNewChug(Chug chug, Player chugger, Player nextPlayer, Game game) {
        eventBus.fire(new ChugEvent(chug, chugger, nextPlayer, game.getGameId()));
    }
}
