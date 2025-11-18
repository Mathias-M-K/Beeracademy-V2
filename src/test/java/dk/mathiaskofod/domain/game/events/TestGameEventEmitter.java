package dk.mathiaskofod.domain.game.events;

import dk.mathiaskofod.domain.game.events.emitter.GameEventEmitter;
import dk.mathiaskofod.domain.game.models.Chug;
import dk.mathiaskofod.domain.game.models.Turn;
import dk.mathiaskofod.domain.game.models.GameId;
import dk.mathiaskofod.domain.game.player.Player;

import java.time.Duration;

/**
 * Test helper: a no-op implementation of {@link GameEventEmitter} that does nothing.
 * Place under src/test/java so it's only used by tests.
 */
public class TestGameEventEmitter implements GameEventEmitter {

    @Override
    public void onStartGame(GameId gameId) {

    }

    @Override
    public void onEndGame(GameId gameId, Duration gameDuration) {

    }

    @Override
    public void onEndOfTurn(Turn turn, Player previousPlayer, Player newPlayer, Player nextPlayer, GameId gameId) {

    }


    @Override
    public void onNewChug(Chug chug, Player player, GameId gameId) {

    }

    @Override
    public void onPauseGame(GameId gameId) {
        // no-op for tests
    }

    @Override
    public void onResumeGame(GameId gameId) {
        // no-op for tests
    }
}

