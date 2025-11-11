package dk.mathiaskofod.services.game.event;

import dk.mathiaskofod.services.game.event.events.EndOfTurnEvent;
import dk.mathiaskofod.services.game.id.generator.models.GameId;
import dk.mathiaskofod.services.game.models.Card;
import dk.mathiaskofod.services.player.models.Player;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Event;
import jakarta.inject.Inject;

import java.time.Duration;

@ApplicationScoped
public class GameEventEmitter {

    @Inject
    Event<EndOfTurnEvent> eventBus;

    public void onEndOfTurn(Duration elapsedTime, Card card, Player newPlayer, GameId gameId) {
        eventBus.fire(new EndOfTurnEvent(elapsedTime.toMillis(), card, newPlayer.id(), gameId));
    }
}
