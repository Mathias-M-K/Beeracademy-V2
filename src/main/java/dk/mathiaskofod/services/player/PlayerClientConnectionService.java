package dk.mathiaskofod.services.player;

import dk.mathiaskofod.services.auth.models.Token;
import dk.mathiaskofod.services.auth.AuthService;
import dk.mathiaskofod.services.auth.models.TokenInfo;
import dk.mathiaskofod.services.common.exceptions.NoConnectionIdException;
import dk.mathiaskofod.services.game.GameService;
import dk.mathiaskofod.services.game.id.generator.models.GameId;
import dk.mathiaskofod.services.player.exeptions.PlayerAlreadyClaimedException;
import dk.mathiaskofod.services.player.exeptions.PlayerNotClaimedException;
import dk.mathiaskofod.services.player.models.Player;
import dk.mathiaskofod.services.player.models.action.PlayerAction;
import dk.mathiaskofod.services.player.models.action.PlayerDataType;
import io.quarkus.websockets.next.OpenConnections;
import io.quarkus.websockets.next.WebSocketConnection;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@ApplicationScoped
public class PlayerClientConnectionService {

    @Inject
    GameService gameService;

    @Inject
    AuthService authService;

    @Inject
    OpenConnections connections;

    //TODO should this be another pattern?
    public void onPlayerAction(PlayerAction action, TokenInfo tokenInfo) {

        switch (action.type()) {
            case endOfTurn -> {
                gameService.endOfTurn(action.data().get(PlayerDataType.elapsedTime), tokenInfo.gameId(), tokenInfo.playerId());
            }
            case chug -> {
                return;
            }
        }

    }

    public Token claimPlayer(GameId gameId, String playerId) {

        Player player = gameService.getPlayer(gameId, playerId);

        if (player.connectionInfo().isClaimed()) {
            throw new PlayerAlreadyClaimedException(playerId, gameId);
        }

        player.connectionInfo().setClaimed(true);

        log.info("Player claimed! PlayerID:{}, GameID:{}", playerId, gameId.humanReadableId());
        return authService.createPlayerClientToken(player, gameId);
    }

    public void registerConnection(TokenInfo tokenInfo, String websocketConnId) {
        registerConnection(tokenInfo.playerId(), tokenInfo.gameId(), websocketConnId);
    }

    public void registerConnection(String playerId, GameId gameId, String websocketConnId) {

        Player player = gameService.getPlayer(gameId, playerId);

        if (!player.connectionInfo().isClaimed()) {
            throw new PlayerNotClaimedException(playerId, gameId);
        }

        player.connectionInfo().setConnected(true);
        player.connectionInfo().setConnectionId(websocketConnId);

        log.info("Websocket Connection: Type:New player connection, PlayerName:{}, PlayerID:{}, GameID:{}, WebsocketConnID:{}", player.name(), playerId, gameId.humanReadableId(), websocketConnId);

    }

    public void registerDisconnect(TokenInfo tokenInfo) {
        registerDisconnect(tokenInfo.playerId(), tokenInfo.gameId());
    }

    public void registerDisconnect(String playerId, GameId gameId) {

        Player player = gameService.getPlayer(gameId, playerId);
        String websocketConnId = getWebsocketId(player, gameId);

        log.info("Player disconnected! PlayerName:{}, PlayerID:{}, GameID:{}, WebsocketConnID:{}", player.name(), playerId, gameId.humanReadableId(), websocketConnId);

        player.connectionInfo().setConnected(false);
        player.connectionInfo().setConnectionId(null);
    }

    public void relinquishPlayer(TokenInfo tokenInfo) {
        relinquishPlayer(tokenInfo.playerId(), tokenInfo.gameId());
    }

    public void relinquishPlayer(String playerId, GameId gameId) {

        Player player = gameService.getPlayer(gameId, playerId);

        String connectionId = getWebsocketId(player, gameId);

        WebSocketConnection connection = connections.findByConnectionId(connectionId).orElseThrow(
                () -> new IllegalStateException("")
        );

        player.connectionInfo().setClaimed(false);

        log.info("Player relinquished! PlayerName:{}, PlayerID:{}, GameID:{}, WebsocketConnID:{}", player.name(), player.id(), gameId.humanReadableId(), connectionId);
        connection.closeAndAwait();
    }

    private String getWebsocketId(Player player, GameId gameId) {
        return player.connectionInfo().getConnectionId().orElseThrow(
                () -> new NoConnectionIdException(gameId, player.id())
        );
    }


//    public void sendText(String playerName, String message){
//        String connectionId = connectedPlayers.get(playerName).connectionInfo().getConnectionId().orElseThrow();
//        connections.findByConnectionId(connectionId).ifPresent(conn -> {
//            log.info("Sending message to connectionId {}: {}", connectionId, message);
//            conn.sendTextAndAwait(message);
//        });
//    }
}
