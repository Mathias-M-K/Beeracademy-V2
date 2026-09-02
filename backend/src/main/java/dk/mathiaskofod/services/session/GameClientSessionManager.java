package dk.mathiaskofod.services.session;

import dk.mathiaskofod.domain.game.events.*;
import dk.mathiaskofod.domain.game.models.Chug;
import dk.mathiaskofod.services.auth.models.TokenInfo;
import dk.mathiaskofod.services.game.exceptions.GameNotFoundException;
import dk.mathiaskofod.services.session.actions.game.client.*;
import dk.mathiaskofod.services.session.actions.game.common.DrawCardAction;
import dk.mathiaskofod.services.session.envelopes.*;
import dk.mathiaskofod.services.session.events.game.game.*;
import dk.mathiaskofod.services.session.events.game.gameclient.GameClientConnectedEvent;
import dk.mathiaskofod.services.session.events.game.gameclient.PlayerReleaseRequestedEvent;
import dk.mathiaskofod.services.session.exceptions.*;
import io.quarkus.websockets.next.CloseReason;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.ws.rs.core.Response;
import lombok.extern.slf4j.Slf4j;

import java.util.List;

@Slf4j
@ApplicationScoped
public class GameClientSessionManager extends AbstractGameSessionManager {

    public void onNewConnection(String websocketConnectionId, TokenInfo tokenInfo) {

        String partyId = tokenInfo.getPartyId();

        if (!gameService.gameExists(partyId)) {
            throw new GameNotFoundException(partyId);
        }

        sessionRegistry.setConnectionId(partyId, websocketConnectionId);

        log.info(
                "Websocket Connection: Type:New game client connection, PartyID:{}, WebsocketConnID:{}",
                partyId,
                websocketConnectionId);

        confirmHandshake(tokenInfo, GameClientEventEnvelope::new);
        broadcastToParty(partyId, new GameClientEventEnvelope(new GameClientConnectedEvent()), List.of(tokenInfo.getClientId()));
        provideGameSnapshotToClient(tokenInfo, GameClientEventEnvelope::new);
        provideIdentityToClient(tokenInfo, GameClientEventEnvelope::new);
    }

    public void onConnectionClosed(TokenInfo tokenInfo, CloseReason closeReason) {

        String partyId = tokenInfo.getPartyId();

        sessionRegistry.clearConnectionId(partyId);

        log.info("Game client disconnected. PartyID:{}", partyId);
    }

    public void onMessage(TokenInfo tokenInfo, WebsocketEnvelope<?> envelope) {

        if (!(envelope instanceof GameClientActionEnvelope(GameClientAction action))) {
            throw new UnknownCategoryException("Invalid envelope type for game client action", 400);
        }

        String partyId = tokenInfo.getPartyId();
        switch (action) {
            case StartGameAction() -> gameService.startGame(partyId);
            case EndGameAction() -> gameService.endGame(partyId);
            case PauseGameAction() -> gameService.pauseGame(partyId);
            case ResumeGameAction() -> gameService.resumeGame(partyId);
            case DrawCardAction(long duration) -> gameService.drawCard(duration, partyId);
            case RegisterChugAction(Chug chug) -> gameService.registerChug(chug, partyId);
            case ReleasePlayerAction(String playerId) -> releasePlayer(partyId, playerId, GameClientEventEnvelope::new);
            default -> throw new UnknownActionException(action.getClass().getSimpleName(), 500);
        }
    }

    public void requestParticipantRelease(String partyId, String participantId) {

        if (!partyService.isParticipantMemberOfParty(partyId, participantId)) {
            throw new PartyMemberNotFoundException(partyId, participantId);
        }

        boolean isPartyLeaderConnected = sessionRegistry.getSession(partyId)
                .orElseThrow(() -> new SessionNotFoundException(partyId))
                .isConnected();

        if (!isPartyLeaderConnected) {
            throw new NoPartyLeaderConnectedException("No party leader is connected to approve the request", Response.Status.CONFLICT);
        }

        boolean isPlayerConnected = sessionRegistry.getSession(participantId)
                .orElseThrow(() -> new SessionNotFoundException(participantId))
                .isConnected();

        if (isPlayerConnected) {
            throw new SessionConnectedException(participantId);
        }

        broadcastToPartyLeader(partyId, new GameClientEventEnvelope(new PlayerReleaseRequestedEvent(participantId)));
    }

    private void broadcastToPartyLeader(String partyId, WebsocketEnvelope<?> envelope) {
        sendMessage(partyId, envelope);
    }

    /**
     * Game Events
     */
    void onGameEvent(@Observes GameEvent gameEvent) {

        GameEventDto dto =
                switch (gameEvent) {
                    case StartGameEvent ignored -> new GameStartGameEventDto();
                    case EndGameEvent endGameEvent -> GameEndEventDto.fromGameEvent(endGameEvent);
                    case DrawCardEvent e -> DrawCardGameEventDto.fromGameEvent(e);
                    case ChugEvent e -> ChugGameEventDto.fromGameEvent(e);
                    case PauseGameEvent pausedGameEvent -> GamePausedGameEventDto.fromGameEvent(pausedGameEvent);
                    case ResumeGameEvent resumeGameEvent -> GameResumedGameEventDto.fromGameEvent(resumeGameEvent);

                    default -> throw new UnknownEventException(gameEvent.getClass().getSimpleName(), 500);
                };

        GameEventEnvelope envelope = new GameEventEnvelope(dto);

        // The game id IS the party id — the domain simply never learns that word.
        broadcastToParty(gameEvent.gameId(), envelope);
    }
}
