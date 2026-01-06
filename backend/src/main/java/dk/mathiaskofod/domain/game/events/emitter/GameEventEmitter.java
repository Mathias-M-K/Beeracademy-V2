package dk.mathiaskofod.domain.game.events.emitter;

import dk.mathiaskofod.domain.game.models.Chug;
import dk.mathiaskofod.domain.game.models.Turn;
import dk.mathiaskofod.domain.game.player.Player;

import java.time.Duration;

public interface GameEventEmitter {

    void onStartGame(String gameId);

    void onEndGame(String gameId, Duration gameDuration);

    void onPauseGame(String gameId);

    void onResumeGame(String gameId);

    void onDrawCard(Turn turn, Player previousPlayer, Player newPlayer, Player nextPlayer, String gameId);

    void onNewChug(Chug chug, Player player, String gameId);



}
