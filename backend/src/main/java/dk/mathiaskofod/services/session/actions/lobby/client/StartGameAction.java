package dk.mathiaskofod.services.session.actions.lobby.client;

import java.time.Instant;
import lombok.Getter;

public class StartGameAction implements LobbyClientAction {

    @Getter
    Instant startTime;

    public StartGameAction() {
        this.startTime = Instant.now();
    }
}
