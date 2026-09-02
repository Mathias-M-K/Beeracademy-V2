package dk.mathiaskofod.services.session;

import dk.mathiaskofod.common.dto.game.GameDto;
import dk.mathiaskofod.domain.game.player.Player;
import dk.mathiaskofod.services.auth.models.TokenInfo;
import dk.mathiaskofod.services.event.publisher.SseEventPublisher;
import dk.mathiaskofod.services.event.publisher.models.ConnectionEvent;
import dk.mathiaskofod.services.game.GameSessionService;
import dk.mathiaskofod.services.game.exceptions.GameNotFoundException;
import dk.mathiaskofod.services.party.PartyService;
import dk.mathiaskofod.services.session.envelopes.WebsocketEnvelope;
import dk.mathiaskofod.services.session.events.game.common.GameSnapshotEvent;
import dk.mathiaskofod.services.session.events.game.gameclient.PlayerReleasedEvent;
import dk.mathiaskofod.services.session.exceptions.SessionConnectedException;
import dk.mathiaskofod.services.session.exceptions.SessionNotFoundException;
import dk.mathiaskofod.services.session.repository.Session;
import jakarta.inject.Inject;
import lombok.extern.slf4j.Slf4j;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.function.Function;

@Slf4j
public abstract class AbstractGameSessionManager extends AbstractSessionManager {

    @Inject
    GameSessionService gameSessionService;

    @Inject
    PartyService partyService;

    @Inject
    SseEventPublisher sseEventPublisher;

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

    protected void provideGameSnapshotToClient(TokenInfo tokenInfo, Function<GameSnapshotEvent, WebsocketEnvelope<?>> envelope) {
        GameDto game = gameSessionService.getGameView(tokenInfo.getPartyId());
        GameSnapshotEvent gameSnapshotEvent = new GameSnapshotEvent(game);
        sendMessage(tokenInfo.getClientId(), envelope.apply(gameSnapshotEvent));
    }

    public void releasePlayer(String partyId, String playerId, Function<PlayerReleasedEvent, WebsocketEnvelope<?>> envelope) {

        Session session = sessionRegistry.getSession(playerId)
                .orElseThrow(() -> new SessionNotFoundException(playerId));

        if(session.isConnected()){
            throw new SessionConnectedException(playerId);
        }



        sessionRegistry.removeSession(playerId);

        sseEventPublisher.publishNewConnectionEvent(partyId, playerId, ConnectionEvent.RELEASED);
        log.info("Player released! PlayerID:{}, PartyID:{}", playerId, partyId);
        broadcastToParty(partyId, envelope.apply(new PlayerReleasedEvent(playerId)));
    }


}
