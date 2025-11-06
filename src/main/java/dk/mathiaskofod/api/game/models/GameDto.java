package dk.mathiaskofod.api.game.models;

import dk.mathiaskofod.services.game.models.Game;

import java.util.List;

public record GameDto(String name, String id, List<PlayerDto> players) {

    public static GameDto fromGame(Game game){

        List<PlayerDto> players = game.players().stream()
                .map(PlayerDto::fromPlayer)
                .toList();

        return new GameDto(
                game.name(),
                game.gameId().humanReadableId(),
                players
        );
    }
}
