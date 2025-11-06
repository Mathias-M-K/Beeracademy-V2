package dk.mathiaskofod.services.game.models;

import java.util.List;

public record Stats(List<Turn> turns, List<Chug> chugs) {

    public static Stats create(){
        return new Stats(List.of(), List.of());
    }
}
