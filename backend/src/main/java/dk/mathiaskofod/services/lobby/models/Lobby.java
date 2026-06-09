package dk.mathiaskofod.services.lobby.models;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.Getter;
import org.eclipse.microprofile.openapi.annotations.media.Schema;

@Schema(description = "Represents a game lobby containing the lobby state and its participants")
public class Lobby {

    @Getter
    private final String name;

    @Getter
    private final String id;

    private final Map<String, LobbyParticipant> participants = new HashMap<>();

    public Lobby(String name, String id) {
        this.name = name;
        this.id = id;
    }

    public void addParticipant(LobbyParticipant participant) {
        participants.put(participant.id(), participant);
    }

    public void removeParticipant(String participantId) {
        participants.remove(participantId);
    }

    public LobbyParticipant getParticipant(String participantId) {
        return participants.get(participantId);
    }

    public List<LobbyParticipant> getParticipants() {
        return participants.values().stream().toList();
    }
}
