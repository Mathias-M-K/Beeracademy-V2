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

    protected void broadcastToParty(String gameId, WebsocketEnvelope<?> envelope) {
        broadcastToParty(gameId, envelope, Collections.emptyList());
    }

    protected void broadcastToParty(String gameId, WebsocketEnvelope<?> envelope, List<String> excluded) {

        Session gameClientSession =
                sessionRegistry.getSession(gameId).orElseThrow(() -> new GameNotFoundException(gameId));

        gameService.getGame(gameId).getPlayers().stream()
                .map(Player::id)
                .filter(playerId -> !excluded.contains(playerId))
                .map(sessionRegistry::getSession)
                .flatMap(Optional::stream)
                .filter(session -> session.getConnectionId().isPresent())
                .forEach(session -> sendMessage(session.getSessionId(), envelope));

        if (!excluded.contains(gameId) && gameClientSession.isConnected()) {
            sendMessage(gameClientSession.getSessionId(), envelope);
        }
    }

    protected void provideGameSnapshotToClient(TokenInfo tokenInfo, Function<GameSnapshotEvent, WebsocketEnvelope<?>> envelope) {
        GameDto game = gameSessionService.getGameView(tokenInfo.getGameId());
        GameSnapshotEvent gameSnapshotEvent = new GameSnapshotEvent(game);
        sendMessage(tokenInfo.getClientId(), envelope.apply(gameSnapshotEvent));
    }

}
