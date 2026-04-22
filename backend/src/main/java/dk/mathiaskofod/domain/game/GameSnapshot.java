package dk.mathiaskofod.domain.game;

import dk.mathiaskofod.domain.game.deck.DeckSnapshot;
import dk.mathiaskofod.domain.game.deck.models.Card;
import dk.mathiaskofod.domain.game.models.GameState;
import dk.mathiaskofod.domain.game.player.Player;
import dk.mathiaskofod.domain.game.timer.TimerSnapshot;

import java.util.ArrayList;
import java.util.LinkedList;
import java.util.List;
import java.util.Queue;

public record GameSnapshot(
        String gameId,
        String name,
        GameState gameState,
        int turnCounter,
        Card lastCard,
        List<String> playerOrder,
        Queue<Player> playerQueue,
        DeckSnapshot deck,
        TimerSnapshot gameTimer,
        TimerSnapshot playerTimer
) {

    public static GameSnapshot of(Game game) {
        return new GameSnapshot(
                game.getGameId(),
                game.getName(),
                game.getGameState(),
                game.getTurnCounter(),
                game.getLastCardDrawn(),
                new ArrayList<>(game.getPlayers().stream().map(Player::id).toList()),
                new LinkedList<>(game.getPlayerQueue()),
                DeckSnapshot.of(game.getDeck()),
                TimerSnapshot.of(game.getGameTimer()),
                TimerSnapshot.of(game.getPlayerTimer())
        );
    }
}
