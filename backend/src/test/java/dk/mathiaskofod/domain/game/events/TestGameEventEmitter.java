package dk.mathiaskofod.domain.game.events;

import dk.mathiaskofod.domain.game.events.emitter.GameEventEmitter;
import dk.mathiaskofod.domain.game.models.Chug;
import dk.mathiaskofod.domain.game.models.Turn;
import dk.mathiaskofod.domain.game.player.Player;

import java.time.Duration;

/**
 * Test helper: a no-op implementation of {@link GameEventEmitter} that does nothing.
 * Place under src/test/java so it's only used by tests.
 */
public class TestGameEventEmitter implements GameEventEmitter {

    @Override
    public void onStartGame(String gameIdDto) {

    }

    @Override
    public void onEndGame(String gameIdDto, Duration gameDuration) {

    }

    @Override
    public void onDrawCard(Turn turn, Player previousPlayer, Player newPlayer, Player nextPlayer, String gameIdDto) {

    }


    @Override
    public void onNewChug(Chug chug, Player player, String gameIdDto) {

    }

    @Override
    public void onPauseGame(String gameIdDto) {
        // no-op for tests
    }

    @Override
    public void onResumeGame(String gameIdDto) {
        // no-op for tests
    }
}

