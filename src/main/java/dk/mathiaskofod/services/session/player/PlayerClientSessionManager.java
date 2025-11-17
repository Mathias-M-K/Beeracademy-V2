package dk.mathiaskofod.services.session.player;

import dk.mathiaskofod.services.auth.models.Token;
import dk.mathiaskofod.services.auth.AuthService;
import dk.mathiaskofod.services.auth.models.TokenInfo;
import dk.mathiaskofod.services.session.AbstractSessionManager;
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
public class PlayerClientSessionManager extends AbstractSessionManager<PlayerSession, String> {

    protected String getConnectionId(String playerId) {

        return getSession(playerId)
                .orElseThrow(() -> new PlayerSessionNotFoundException(playerId))
                .getConnectionId()
                .orElseThrow(() -> new NoConnectionIdException(playerId));
    }

    public Token claimPlayer(GameId gameId, String playerId) {

        Player player = gameService.getPlayer(gameId, playerId);

        if (getSession(playerId).isPresent()) {
            throw new PlayerAlreadyClaimedException(playerId, gameId);
        }

        addSession(playerId, new PlayerSession(playerId));

        log.info("Player claimed! PlayerID:{}, GameID:{}", playerId, gameId.humanReadableId());
        return authService.createPlayerClientToken(player, gameId);
    }

    public void registerConnection(GameId gameId, String playerId, String websocketConnId) {

        getSession(playerId)
                .orElseThrow(() -> new PlayerNotClaimedException(playerId, gameId))
                .setConnectionId(websocketConnId);

        log.info("Websocket Connection: Type:New player connection, PlayerName:{}, PlayerID:{}, GameID:{}, WebsocketConnID:{}", "Unknown", playerId, gameId.humanReadableId(), websocketConnId);

    }

    public void registerDisconnect(GameId gameId, String playerId) {

        getSession(playerId)
                .orElseThrow(() -> new PlayerSessionNotFoundException(playerId))
                .clearConnectionId();


        log.info("Player disconnected! PlayerName:{}, PlayerID:{}, GameID:{}, WebsocketConnID:{}", "Unknown", playerId, gameId.humanReadableId(), "");
    }

    public void relinquishPlayer(GameId gameId, String playerId) {

        WebSocketConnection connection = getWebsocketConnection(playerId);

        PlayerSession playerSession = getSession(playerId)
                .orElseThrow(() -> new PlayerSessionNotFoundException(playerId));

        log.info("Player relinquished! PlayerName:{}, PlayerID:{}, GameID:{}, WebsocketConnID:{}", "Unknown", playerSession.getPlayerId(), gameId.humanReadableId(), getConnectionId(playerId));

        removeSession(playerId);
        connection.closeAndAwait();
    }


    //TODO should this be another pattern?
    public void onPlayerAction(PlayerAction action, GameId gameId, String playerId) {

        switch (action.type()) {
            case startGame -> gameService.startGame(gameId);
            case endOfTurn -> gameService.endOfTurn(123, gameId, playerId);
            case chug -> log.info("Player {} in game {} is chugging!", playerId, gameId.humanReadableId());
            default -> log.error("Action type not supported by PlayerClient: {}", action.type());
        }

    }

}
