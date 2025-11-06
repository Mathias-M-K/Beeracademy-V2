package dk.mathiaskofod.services.player;

import dk.mathiaskofod.services.game.GameService;
import dk.mathiaskofod.services.player.models.Player;
import io.quarkus.websockets.next.OpenConnections;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import lombok.extern.slf4j.Slf4j;
import org.jboss.resteasy.reactive.common.NotImplementedYet;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@ApplicationScoped
public class PlayerConnectionService {

    @Inject
    GameService gameService;

    @Inject
    OpenConnections connections;

    private final Map<String,Player> players = new HashMap<>();

    public void registerPlayer(String name, String id){
        throw new NotImplementedYet();
    }

    public List<Player> getPlayers(){
        return players.values().stream().toList();
    }


    public void sendText(String playerName, String message){
        String connectionId = players.get(playerName).connectionInfo().getConnectionId().orElseThrow();
        connections.findByConnectionId(connectionId).ifPresent(conn -> {;
            log.info("Sending message to connectionId {}: {}", connectionId, message);
            conn.sendTextAndAwait(message);
        });
    }



}
