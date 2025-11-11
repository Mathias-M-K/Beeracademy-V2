package dk.mathiaskofod.services.game;

import dk.mathiaskofod.services.auth.AuthService;
import dk.mathiaskofod.services.auth.models.Token;
import dk.mathiaskofod.services.common.exceptions.NoConnectionIdException;
import dk.mathiaskofod.services.common.models.ConnectionInfo;
import dk.mathiaskofod.services.game.event.events.EndOfTurnEvent;
import dk.mathiaskofod.services.game.id.generator.models.GameId;
import io.quarkus.websockets.next.OpenConnections;
import io.quarkus.websockets.next.WebSocketConnection;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.inject.Inject;
import lombok.extern.slf4j.Slf4j;
import org.jboss.resteasy.reactive.common.NotImplementedYet;

@Slf4j
@ApplicationScoped
public class GameClientConnectionService {

    @Inject
    GameService gameService;

    @Inject
    AuthService authService;

    @Inject
    OpenConnections connections;

    public Token claimGame(GameId gameId){

        Game game = gameService.getGame(gameId);

        if(game.getConnectionInfo().isClaimed()){
            //FIXME this is not done
            throw new NotImplementedYet();
        }

        game.getConnectionInfo().setClaimed(true);

        return authService.createGameClientToken(gameId);
    }

    public void registerConnection(GameId gameId, String websocketConnId){

        Game game = gameService.getGame(gameId);
        ConnectionInfo connInfo = game.getConnectionInfo();

        if(!connInfo.isClaimed()){
            //FIXME
            throw new NotImplementedYet();
        }

        connInfo.setConnected(true);
        connInfo.setConnectionId(websocketConnId);

        log.info("Websocket Connection: Type:New game client connection, GameID:{}, WebsocketConnID:{}", gameId.humanReadableId(), websocketConnId);

    }

    public void onEndOfTurnEvent(@Observes EndOfTurnEvent event){

        String connectionId = gameService.getGame(event.gameId())
                .getConnectionInfo()
                .getConnectionId()
                .orElseThrow(()-> new NoConnectionIdException(event.gameId()));

        //FIXME
        WebSocketConnection connection = connections.findByConnectionId(connectionId)
                .orElseThrow(NotImplementedYet::new);

        connection.sendTextAndAwait(event.toJson());
    }



}
