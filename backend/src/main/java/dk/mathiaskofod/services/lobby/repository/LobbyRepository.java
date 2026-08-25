package dk.mathiaskofod.services.lobby.repository;

import dk.mathiaskofod.services.lobby.exceptions.LobbyNotFoundException;
import dk.mathiaskofod.services.lobby.models.Lobby;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@ApplicationScoped
public class LobbyRepository {

    private final Map<String, Lobby> lobbies = new HashMap<>();

    public void addLobby(Lobby lobby) {
        lobbies.put(lobby.getId(), lobby);
    }

    public Lobby getLobby(String partyId) {
        return Optional.ofNullable(lobbies.get(partyId)).orElseThrow(() -> new LobbyNotFoundException(partyId));
    }

    public void removeLobby(String partyId) {
        lobbies.remove(partyId);
    }
}
