package dk.mathiaskofod.api.player;

import dk.mathiaskofod.services.player.PlayerConnectionService;
import dk.mathiaskofod.services.player.models.Player;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.QueryParam;

import java.util.List;

@Path("/players")
public class PlayerApi {

    @Inject
    PlayerConnectionService playerConnectionService;

    @GET
    public List<Player> getPlayers(){
        return playerConnectionService.getPlayers();
    }

    @POST
    @Path("/text")
    public void textPlayer(@QueryParam("player") String player){
        String text = "This is a text message to player " + player;
        playerConnectionService.sendText(player, text);
    }


}
