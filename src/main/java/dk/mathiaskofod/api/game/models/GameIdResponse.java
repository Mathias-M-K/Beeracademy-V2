package dk.mathiaskofod.api.game.models;

import dk.mathiaskofod.services.game.game.id.generator.models.GameId;

public record GameIdResponse(String gameId) {

    public static GameIdResponse fromGameId(GameId gameId){
        return new GameIdResponse(gameId.humanReadableId());
    }
}
