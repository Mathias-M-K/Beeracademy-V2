package dk.mathiaskofod.services.session;

import dk.mathiaskofod.common.dto.game.GameDto;
import dk.mathiaskofod.domain.game.player.Player;
import dk.mathiaskofod.services.auth.models.TokenInfo;
import dk.mathiaskofod.services.game.GameSessionService;
import dk.mathiaskofod.services.game.exceptions.GameNotFoundException;
import dk.mathiaskofod.services.session.envelopes.WebsocketEnvelope;
import dk.mathiaskofod.services.session.events.game.common.GameSnapshotEvent;
import dk.mathiaskofod.services.session.repository.Session;
import jakarta.inject.Inject;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.function.Function;

public abstract class AbstractGameSessionManager extends AbstractSessionManager {

    @Inject
    GameSessionService gameSessionService;

    protected void broadcastToParty(String partyId, WebsocketEnvelope<?> envelope) {
        broadcastToParty(partyId, envelope, Collections.emptyList());
    }

    protected void broadcastToParty(String partyId, WebsocketEnvelope<?> envelope, List<String> excluded) {

        Session gameClientSession =
                sessionRegistry.getSession(partyId).orElseThrow(() -> new GameNotFoundException(partyId));

        gameService.getGame(partyId).getPlayers().stream()
                .map(Player::id)
                .filter(playerId -> !excluded.contains(playerId))
                .map(sessionRegistry::getSession)
                .flatMap(Optional::stream)
                .filter(session -> session.getConnectionId().isPresent())
                .forEach(session -> sendMessage(session.getSessionId(), envelope));

        if (!excluded.contains(partyId) && gameClientSession.isConnected()) {
            sendMessage(gameClientSession.getSessionId(), envelope);
        }
    }

    protected void provideGameSnapshotToClient(
            TokenInfo tokenInfo, Function<GameSnapshotEvent, WebsocketEnvelope<?>> envelope) {
        GameDto game = gameSessionService.getGameView(tokenInfo.getPartyId());
        GameSnapshotEvent gameSnapshotEvent = new GameSnapshotEvent(game);
        sendMessage(tokenInfo.getClientId(), envelope.apply(gameSnapshotEvent));
    }
}
