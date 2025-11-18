package dk.mathiaskofod.domain.game.events.emitter;

import dk.mathiaskofod.domain.game.models.Chug;
import dk.mathiaskofod.domain.game.models.Turn;
import dk.mathiaskofod.domain.game.models.GameId;
import dk.mathiaskofod.domain.game.player.Player;

import java.time.Duration;

public interface GameEventEmitter {

    void onStartGame(GameId gameId);

    void onEndGame(GameId gameId, Duration gameDuration);

    void onEndOfTurn(Turn turn, Player previousPlayer, Player newPlayer, Player nextPlayer, GameId gameId);

    void onNewChug(Chug chug, Player player, GameId gameId);

    void onPauseGame(GameId gameId);

    void onResumeGame(GameId gameId);

}
