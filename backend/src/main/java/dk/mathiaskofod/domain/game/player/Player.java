package dk.mathiaskofod.domain.game.player;

import dk.mathiaskofod.domain.game.player.models.Stats;

public record Player(String name, String id, int sipsInABeer, boolean canDrawChugCard, Stats stats) {}
