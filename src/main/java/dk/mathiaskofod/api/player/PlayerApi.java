package dk.mathiaskofod.api.player;

import dk.mathiaskofod.api.game.models.PlayerDto;
import dk.mathiaskofod.services.game.GameService;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.QueryParam;

import java.util.List;

@Path("/players")
public class PlayerApi {

    @Inject
    GameService gameService;

    @GET
    public List<PlayerDto> getPlayers(@QueryParam("game-id") String gameId){
        return gameService.getGames().stream()
                .filter(game -> game.gameId().humanReadableId().equals(gameId))
                .flatMap(game -> game.players().stream())
                .map(PlayerDto::fromPlayer)
                .toList();
    }
}
