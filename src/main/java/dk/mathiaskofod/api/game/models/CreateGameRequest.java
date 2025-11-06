package dk.mathiaskofod.api.game.models;

import java.util.List;

public record CreateGameRequest(String name, List<String> playerNames) {
}
