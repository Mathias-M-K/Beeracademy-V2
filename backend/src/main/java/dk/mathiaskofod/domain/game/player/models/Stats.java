package dk.mathiaskofod.domain.game.player.models;

import dk.mathiaskofod.domain.game.models.Chug;
import dk.mathiaskofod.domain.game.models.Turn;
import lombok.Getter;

import java.util.ArrayList;
import java.util.List;

@Getter
public class Stats {
    private final List<Turn> turns = new ArrayList<>();
    private final List<Chug> chugs = new ArrayList<>();

    public void addTurn(Turn turn){
        turns.add(turn);
    }

    public void addChug(Chug chug){
        chugs.add(chug);
    }
}
