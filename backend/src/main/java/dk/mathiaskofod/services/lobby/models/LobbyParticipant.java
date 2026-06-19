package dk.mathiaskofod.services.lobby.models;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.Accessors;

// TODO create title service that hands out titles
@Getter
@Setter
@AllArgsConstructor
public class LobbyParticipant {

    private static final int DEFAULT_SIPS_IN_A_BEER = 14;
    private static final boolean DEFAULT_CAN_DRAW_ACE = true;

    private String name;
    private String title;
    private String id;
    private int sipsInABeer;

    @Accessors(fluent = true)
    private boolean canDrawAce;

    public LobbyParticipant(String name, String title, String id) {
        this.name = name;
        this.title = title;
        this.id = id;
        this.sipsInABeer = DEFAULT_SIPS_IN_A_BEER;
        this.canDrawAce = DEFAULT_CAN_DRAW_ACE;
    }

    public void updateSettings(int sipsInABeer, boolean canDrawAce) {
        this.sipsInABeer = sipsInABeer;
        this.canDrawAce = canDrawAce;
    }
}
