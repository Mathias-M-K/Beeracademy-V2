package dk.mathiaskofod.services.lobby.models;

import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import org.eclipse.microprofile.openapi.annotations.media.Schema;

@Schema(description = "Represents a game lobby containing the lobby state and its participants")
public class Lobby {

    @Getter
    private final String name;

    @Getter
    private final String id;

    @Getter
    private final List<LobbyParticipant> participants = new ArrayList<>();

    public Lobby(String name, String id) {
        this.name = name;
        this.id = id;
    }

    public void addParticipant(LobbyParticipant participant) {
        participants.add(participant);
    }
}
