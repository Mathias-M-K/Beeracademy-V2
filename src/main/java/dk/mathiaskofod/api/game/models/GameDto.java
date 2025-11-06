package dk.mathiaskofod.api.game.models;

import dk.mathiaskofod.services.game.models.Game;

import java.util.List;

public record GameDto(String name, String id, List<String> players) {

    public static GameDto fromGame(Game game){

        List<String> players = game.players().stream()
                .map(player -> player.name())
                .toList();

        return new GameDto(
                game.name(),
                game.gameId().humanReadableId(),
                players
        );
    }
}
