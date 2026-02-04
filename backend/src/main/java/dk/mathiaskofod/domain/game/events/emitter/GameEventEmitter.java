package dk.mathiaskofod.domain.game.events.emitter;

import dk.mathiaskofod.domain.game.Game;
import dk.mathiaskofod.domain.game.models.Chug;
import dk.mathiaskofod.domain.game.models.Turn;
import dk.mathiaskofod.domain.game.player.Player;

public interface GameEventEmitter {

    void onStartGame(Game game);

    void onEndGame(Game game);

    void onPauseGame(Game game);

    void onResumeGame(Game game);

    void onDrawCard(Turn turn, Player previousPlayer, Player newPlayer, Player nextPlayer, Game game);

    void onNewChug(Chug chug, Player chugger, Player nextPlayer, Game game);
}
