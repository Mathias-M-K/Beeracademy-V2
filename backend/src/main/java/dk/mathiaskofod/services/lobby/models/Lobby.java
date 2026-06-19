package dk.mathiaskofod.services.lobby.models;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import lombok.Getter;
import org.eclipse.microprofile.openapi.annotations.media.Schema;

@Schema(description = "Represents a game lobby containing the lobby state and its participants")
public class Lobby {

    @Getter
    private final String name;

    @Getter
    private final String id;

    @Getter
    private boolean abandoned;

    @Getter
    private boolean transitioning;

    private final Map<String, LobbyParticipant> participants = new HashMap<>();

    public Lobby(String name, String id) {
        this.name = name;
        this.id = id;
    }

    public void addParticipant(LobbyParticipant participant) {
        participants.put(participant.getId(), participant);
    }

    public void removeParticipant(String participantId) {
        participants.remove(participantId);
    }

    public Optional<LobbyParticipant> getParticipant(String participantId) {
        return Optional.ofNullable(participants.get(participantId));
    }

    public List<LobbyParticipant> getParticipants() {
        return participants.values().stream().toList();
    }

    public void markAsAbandoned() {
        this.abandoned = true;
    }

    public void markAsTransitioning() {
        this.transitioning = true;
    }
}
