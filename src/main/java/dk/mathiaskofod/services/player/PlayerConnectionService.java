package dk.mathiaskofod.services.player;

import dk.mathiaskofod.services.auth.models.Token;
import dk.mathiaskofod.services.auth.AuthService;
import dk.mathiaskofod.services.auth.models.TokenInfo;
import dk.mathiaskofod.services.game.GameService;
import dk.mathiaskofod.services.game.game.id.generator.models.GameId;
import dk.mathiaskofod.services.player.exeptions.PlayerAlreadyClaimedException;
import dk.mathiaskofod.services.player.exeptions.PlayerNotClaimedException;
import dk.mathiaskofod.services.player.exeptions.PlayerNotFoundException;
import dk.mathiaskofod.services.player.models.Player;
import io.quarkus.websockets.next.OpenConnections;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@ApplicationScoped
public class PlayerConnectionService {

    @Inject
    GameService gameService;

    @Inject
    AuthService authService;

    @Inject
    OpenConnections connections;

    private final Map<String,Player> connectedPlayers = new HashMap<>();

    public Token claimPlayer(GameId gameId, String playerId){

        Player player = gameService.getPlayer(gameId,playerId);

        if(player.connectionInfo().isClaimed()){
            throw new PlayerAlreadyClaimedException(playerId, gameId);
        }

        player.connectionInfo().setClaimed(true);

        return authService.createToken(player,gameId);
    }

    public void registerConnection(TokenInfo tokenInfo, String websocketConnId){
        registerConnection(tokenInfo.playerId(), tokenInfo.gameId(), websocketConnId);
    }
    public void registerConnection(String playerId, GameId gameId, String websocketConnId){

        Player player = gameService.getPlayer(gameId,playerId);

        if (!player.connectionInfo().isClaimed()){
            throw new PlayerNotClaimedException(playerId, gameId);
        }

        player.connectionInfo().setConnected(true);
        player.connectionInfo().setConnectionId(websocketConnId);

        connectedPlayers.put(player.name(), player);
    }

    public void registerDisconnect(TokenInfo tokenInfo){
        registerDisconnect(tokenInfo.playerId(), tokenInfo.gameId());
    }

    public void registerDisconnect(String playerId, GameId gameId) {

        Player player = gameService.getPlayer(gameId,playerId);

        player.connectionInfo().setConnected(false);
        player.connectionInfo().setConnectionId(null);

        connectedPlayers.remove(player.name());
    }


    public void sendText(String playerName, String message){
        String connectionId = connectedPlayers.get(playerName).connectionInfo().getConnectionId().orElseThrow();
        connections.findByConnectionId(connectionId).ifPresent(conn -> {
            log.info("Sending message to connectionId {}: {}", connectionId, message);
            conn.sendTextAndAwait(message);
        });
    }
}
