package dk.mathiaskofod.api.game.models;

import dk.mathiaskofod.domain.game.models.GameId;

public record GameIdDto(String gameId) {

    public static GameIdDto fromGameId(GameId gameId){
        return new GameIdDto(gameId.humanReadableId());
    }
}
