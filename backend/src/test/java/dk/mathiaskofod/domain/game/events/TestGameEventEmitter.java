package dk.mathiaskofod.domain.game.events;

import dk.mathiaskofod.domain.game.events.emitter.GameEventEmitter;
import dk.mathiaskofod.domain.game.models.Chug;
import dk.mathiaskofod.domain.game.models.Turn;
import dk.mathiaskofod.domain.game.player.Player;
import dk.mathiaskofod.domain.game.reports.GameReport;
import dk.mathiaskofod.domain.game.reports.PlayerReport;
import dk.mathiaskofod.domain.game.timer.models.TimeReport;

import java.util.List;

/**
 * Test helper: a no-op implementation of {@link GameEventEmitter} that does nothing.
 * Place under src/test/java so it's only used by tests.
 */
public class TestGameEventEmitter implements GameEventEmitter {

    @Override
    public void onStartGame(String gameIdDto) {
        //Right now, only exist as a "Mock"
    }

    @Override
    public void onEndGame(String gameId, GameReport gameReport, List<PlayerReport> playerReports, TimeReport timeReport) {
        //Right now, only exist as a "Mock"
    }

    @Override
    public void onPauseGame(String gameId, TimeReport timeReport) {
        //Right now, only exist as a "Mock"
    }

    @Override
    public void onResumeGame(String gameId, TimeReport timeReport) {
        //Right now, only exist as a "Mock"
    }

    @Override
    public void onDrawCard(Turn turn, Player previousPlayer, Player newPlayer, Player nextPlayer, String gameIdDto) {
        //Right now, only exist as a "Mock"
    }


    @Override
    public void onNewChug(Chug chug, Player chugger, Player newPlayer, String gameIdDto) {
        //Right now, only exist as a "Mock"
    }

}

