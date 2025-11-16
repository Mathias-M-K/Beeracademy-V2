package dk.mathiaskofod.services.session.player;

import dk.mathiaskofod.services.auth.models.Token;
import dk.mathiaskofod.services.auth.AuthService;
import dk.mathiaskofod.services.auth.models.TokenInfo;
import dk.mathiaskofod.services.session.exceptions.NoConnectionIdException;
import dk.mathiaskofod.services.game.GameService;
import dk.mathiaskofod.services.game.id.generator.models.GameId;
import dk.mathiaskofod.services.session.exceptions.WebsocketConnectionNotFoundException;
import dk.mathiaskofod.services.session.player.models.PlayerSession;
import dk.mathiaskofod.services.session.player.exeptions.PlayerAlreadyClaimedException;
import dk.mathiaskofod.services.session.player.exeptions.PlayerNotClaimedException;
import dk.mathiaskofod.domain.game.player.Player;
import dk.mathiaskofod.services.session.player.exeptions.PlayerSessionNotFoundException;
import dk.mathiaskofod.services.session.player.models.action.PlayerAction;
import io.quarkus.websockets.next.OpenConnections;
import io.quarkus.websockets.next.WebSocketConnection;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import lombok.extern.slf4j.Slf4j;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Slf4j
@ApplicationScoped
public class PlayerClientSessionManager {

    private final Map<String, PlayerSession> playerSessions = new HashMap<>();

    @Inject
    GameService gameService;

    @Inject
    AuthService authService;

    @Inject
    OpenConnections connections;

    private PlayerSession getPlayerSessionOrFail(String playerId) {

        if (!playerSessions.containsKey(playerId)) {
            throw new PlayerSessionNotFoundException(playerId);
        }

        return playerSessions.get(playerId);
    }

    public Optional<PlayerSession> getPlayerSession(String playerId) {
        return Optional.ofNullable(playerSessions.get(playerId));
    }

    private String getConnectionId(String playerId, GameId gameId) {

        return getPlayerSessionOrFail(playerId).getConnectionId().orElseThrow(
                () -> new NoConnectionIdException(playerId, gameId)
        );
    }

    private WebSocketConnection getWebsocketConnection(String playerId, GameId gameId) {
        String connectionId = getConnectionId(playerId, gameId);
        return connections.findByConnectionId(connectionId).orElseThrow(
                () -> new WebsocketConnectionNotFoundException(connectionId)
        );
    }

    public Token claimPlayer(GameId gameId, String playerId) {

        Player player = gameService.getPlayer(gameId, playerId);

        if (playerSessions.containsKey(player.id())) {
            throw new PlayerAlreadyClaimedException(playerId, gameId);
        }

        playerSessions.put(playerId, new PlayerSession(playerId));

        log.info("Player claimed! PlayerID:{}, GameID:{}", playerId, gameId.humanReadableId());
        return authService.createPlayerClientToken(player, gameId);
    }

    public void registerConnection(TokenInfo tokenInfo, String websocketConnId) {

        if (!playerSessions.containsKey(tokenInfo.playerId())) {
            throw new PlayerNotClaimedException(tokenInfo.playerId(), tokenInfo.gameId());
        }

        getPlayerSessionOrFail(tokenInfo.playerId()).setConnectionId(websocketConnId);
        log.info("Websocket Connection: Type:New player connection, PlayerName:{}, PlayerID:{}, GameID:{}, WebsocketConnID:{}", "Unknown", tokenInfo.playerId(), tokenInfo.gameId().humanReadableId(), websocketConnId);

    }

    public void registerDisconnect(TokenInfo tokenInfo) {

        String connectionId = getConnectionId(tokenInfo.playerId(), tokenInfo.gameId());

        log.info("Player disconnected! PlayerName:{}, PlayerID:{}, GameID:{}, WebsocketConnID:{}", "Unknown", tokenInfo.playerId(), tokenInfo.gameId().humanReadableId(), connectionId);

        getPlayerSessionOrFail(tokenInfo.playerId()).clearConnectionId();
    }

    public void relinquishPlayer(String playerId, GameId gameId) {

        WebSocketConnection connection = getWebsocketConnection(playerId, gameId);

        PlayerSession playerSession = getPlayerSessionOrFail(playerId);
        log.info("Player relinquished! PlayerName:{}, PlayerID:{}, GameID:{}, WebsocketConnID:{}", "Unknown", playerSession.getPlayerId(), gameId.humanReadableId(), getConnectionId(playerId,gameId));

        playerSessions.remove(playerId);
        connection.closeAndAwait();
    }


    //TODO should this be another pattern?
    public void onPlayerAction(PlayerAction action, TokenInfo tokenInfo) {

        switch (action.type()) {
            case startGame -> gameService.startGame(tokenInfo.gameId());
            case endOfTurn -> gameService.endOfTurn(123, tokenInfo.gameId(), tokenInfo.playerId());
            case chug ->
                    log.info("Player {} in game {} is chugging!", tokenInfo.playerId(), tokenInfo.gameId().humanReadableId());
            default -> log.error("Action type not supported by PlayerClient: {}", action.type());
        }

    }

}
