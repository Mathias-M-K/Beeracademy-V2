package dk.mathiaskofod.services.game.models;

import dk.mathiaskofod.services.game.game.id.generator.models.GameId;
import dk.mathiaskofod.services.player.models.Player;

import java.util.List;

public record Game(String name, GameId gameId, List<Player> players) {
}
