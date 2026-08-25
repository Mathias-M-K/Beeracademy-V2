package dk.mathiaskofod.services.session;

import dk.mathiaskofod.api.lobby.models.dto.LobbyParticipantDTO;
import dk.mathiaskofod.services.auth.models.TokenInfo;
import dk.mathiaskofod.services.lobby.models.Emoji;
import dk.mathiaskofod.services.lobby.models.LobbyParticipant;
import dk.mathiaskofod.services.session.actions.lobby.common.SendEmojiAction;
import dk.mathiaskofod.services.session.actions.lobby.common.SendMessageAction;
import dk.mathiaskofod.services.session.actions.lobby.common.UpdateSettingsAction;
import dk.mathiaskofod.services.session.actions.lobby.participant.LobbyParticipantAction;
import dk.mathiaskofod.services.session.envelopes.LobbyParticipantActionEnvelope;
import dk.mathiaskofod.services.session.envelopes.LobbyParticipantEventEnvelope;
import dk.mathiaskofod.services.session.envelopes.WebsocketEnvelope;
import dk.mathiaskofod.services.session.events.lobby.common.EmojiSentEvent;
import dk.mathiaskofod.services.session.events.lobby.common.MessageSentEvent;
import dk.mathiaskofod.services.session.events.lobby.participant.*;
import dk.mathiaskofod.services.session.exceptions.UnknownCategoryException;
import dk.mathiaskofod.services.session.repository.Session;
import dk.mathiaskofod.websocket.game.models.WebsocketCodes;
import io.quarkus.websockets.next.CloseReason;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;
import lombok.extern.slf4j.Slf4j;

@ApplicationScoped
@Slf4j
public class LobbyParticipantSessionManager extends AbstractLobbySessionManager {

    // TODO participant session manger uses session registry directly, while client session manager doesn't
    @Override
    public void onNewConnection(String websocketConnectionId, TokenInfo tokenInfo) {
        String partyId = tokenInfo.getPartyId();
        String participantId = tokenInfo.getPlayerId();
        log.info(
                "New participant connected! Name: {}, Player id: {}, Party id: {}, WebsocketId:{}",
                tokenInfo.getName(),
                participantId,
                partyId,
                websocketConnectionId);

        LobbyParticipant lobbyParticipant =
                lobbyService.registerParticipant(partyId, tokenInfo.getName(), participantId, true);

        Session participantSession = new Session(participantId, websocketConnectionId);
        sessionRegistry.registerSession(participantSession);

        confirmHandshake(tokenInfo, LobbyParticipantEventEnvelope::new);
        NewParticipantEvent event = new NewParticipantEvent(LobbyParticipantDTO.fromLobbyParticipant(lobbyParticipant));
        broadcastToLobby(partyId, new LobbyParticipantEventEnvelope(event));

        provideLobbySnapshotToClient(tokenInfo, LobbyParticipantEventEnvelope::new);
        provideIdentityToClient(tokenInfo, LobbyParticipantEventEnvelope::new);
    }

    @Override
    public void onConnectionClosed(TokenInfo tokenInfo, CloseReason closeReason) {

        String partyId = tokenInfo.getPartyId();
        String playerId = tokenInfo.getPlayerId();

        log.info(
                "Lobby participant left. Name: {}, ParticipantID: {}, CloseReason: {}-{}",
                tokenInfo.getName(),
                playerId,
                closeReason.getCode(),
                closeReason.getMessage());

        /*
        TODO we can possibly remove the markAsAbandoned() stuff from Lobby. Just don't use the LobbyService when
         disconnecting or fail gracefully when fetching a Lobby
         */

        lobbyService.removeDisconnectedParticipant(partyId, playerId);

        boolean isTransitioning = WebsocketCodes.TRANSITIONING.getCode() == closeReason.getCode();
        if (isTransitioning) {
            sessionRegistry.clearConnectionId(playerId);
        } else {
            sessionRegistry.removeSession(playerId);
        }

        LobbyParticipantDisconnectedEvent event = new LobbyParticipantDisconnectedEvent(playerId);
        LobbyParticipantEventEnvelope envelope = new LobbyParticipantEventEnvelope(event);

        if (closeReason.getCode() == WebsocketCodes.LOBBY_LEADER_LEFT.getCode()
                || closeReason.getCode() == WebsocketCodes.TRANSITIONING.getCode()) {
            // Skipping broadcast, since every member have already been notified
            return;
        }
        broadcastToLobby(partyId, envelope);
    }

    @Override
    public void onMessage(TokenInfo tokenInfo, WebsocketEnvelope<?> message) {

        String partyId = tokenInfo.getPartyId();
        String playerId = tokenInfo.getPlayerId();

        if (!(message instanceof LobbyParticipantActionEnvelope(LobbyParticipantAction action))) {
            throw new UnknownCategoryException("Invalid envelope type for lobby participant action", 400);
        }

        switch (action) {
            case SendEmojiAction(Emoji emoji) -> {
                EmojiSentEvent event = new EmojiSentEvent(playerId, emoji);
                broadcastToLobby(partyId, new LobbyParticipantEventEnvelope(event), List.of(playerId));
            }
            case SendMessageAction(String clientMessage) -> {
                MessageSentEvent event = new MessageSentEvent(playerId, clientMessage);
                broadcastToLobby(partyId, new LobbyParticipantEventEnvelope(event), List.of(playerId));
            }
            case UpdateSettingsAction updateSettingsAction ->
                applyAndBroadcastSettings(partyId, playerId, updateSettingsAction);
            default ->
                log.warn(
                        "Received unknown action from lobby participant with player id: {}. Action: {}",
                        playerId,
                        action);
        }
    }
}
