package dk.mathiaskofod.domain.game.events.emitter;

import dk.mathiaskofod.domain.game.models.Chug;
import dk.mathiaskofod.domain.game.models.Turn;
import dk.mathiaskofod.domain.game.player.Player;
import dk.mathiaskofod.domain.game.timer.models.TimeReport;

import java.time.Duration;

public interface GameEventEmitter {

    void onStartGame(String gameId);

    void onEndGame(String gameId, TimeReport timeReport);

    void onPauseGame(String gameId, TimeReport timeReport);

    void onResumeGame(String gameId, TimeReport timeReport);

    void onDrawCard(Turn turn, Player previousPlayer, Player newPlayer, Player nextPlayer, String gameId);

    void onNewChug(Chug chug, Player chugger, Player newPlayer, String gameId);
}
