package dk.mathiaskofod.domain.game;

import dk.mathiaskofod.domain.game.deck.models.Card;
import dk.mathiaskofod.domain.game.models.GameState;
import dk.mathiaskofod.domain.game.player.PlayerSnapshot;
import dk.mathiaskofod.domain.game.timer.TimerSnapshot;

import java.util.List;

public record GameSnapshot(
        String gameId,
        String name,
        GameState gameState,
        int currentPlayerIndex,
        int round,
        boolean awaitingChug,
        Card lastCard,
        List<PlayerSnapshot> players,
        List<Card> unusedCards,
        TimerSnapshot gameTimer,
        TimerSnapshot playerTimer
) {

}
