package dk.mathiaskofod.services.player;

import dk.mathiaskofod.api.auth.models.Token;
import dk.mathiaskofod.services.auth.AuthService;
import dk.mathiaskofod.services.game.GameService;
import dk.mathiaskofod.services.game.game.id.generator.models.GameId;
import dk.mathiaskofod.services.player.exeptions.PlayerAlreadyClaimed;
import dk.mathiaskofod.services.player.exeptions.PlayerNotFoundException;
import dk.mathiaskofod.services.player.models.Player;
import io.quarkus.websockets.next.OpenConnections;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import lombok.extern.slf4j.Slf4j;

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

        Player player = gameService.getGame(gameId).players().stream()
                .filter(existingPlayer -> existingPlayer.id().equals(playerId))
                .findFirst()
                .orElseThrow(() -> new PlayerNotFoundException(playerId));

        if(player.connectionInfo().isClaimed()){
            throw new PlayerAlreadyClaimed(playerId, gameId);
        }

        player.connectionInfo().setClaimed(true);

        return authService.createToken(player,gameId);

    }

    public void sendText(String playerName, String message){
        String connectionId = connectedPlayers.get(playerName).connectionInfo().getConnectionId().orElseThrow();
        connections.findByConnectionId(connectionId).ifPresent(conn -> {
            log.info("Sending message to connectionId {}: {}", connectionId, message);
            conn.sendTextAndAwait(message);
        });
    }
}
