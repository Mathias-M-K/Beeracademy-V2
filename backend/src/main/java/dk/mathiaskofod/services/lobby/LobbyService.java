package dk.mathiaskofod.services.lobby;

import dk.mathiaskofod.domain.game.player.Player;
import dk.mathiaskofod.services.game.GameService;
import dk.mathiaskofod.services.game.id.generator.IdGenerator;
import dk.mathiaskofod.services.lobby.exceptions.LobbyNotEmptyException;
import dk.mathiaskofod.services.lobby.models.Lobby;
import dk.mathiaskofod.services.lobby.models.LobbyParticipant;
import dk.mathiaskofod.services.lobby.repository.LobbyRepository;
import dk.mathiaskofod.services.session.exceptions.CannotIdentifyPlayer;
import dk.mathiaskofod.services.session.repository.Session;
import dk.mathiaskofod.services.session.repository.SessionRegistry;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.util.List;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@ApplicationScoped
public class LobbyService {

    @Inject
    GameService gameService;

    @Inject
    SessionRegistry sessionRegistry;

    @Inject
    LobbyRepository lobbyRepository;

    /**
     * Creates a lobby and returns lobby-id
     *
     * @param name Name of lobby, will persist as Game name
     * @return Lobby ID, which will persist as Game ID
     */
    public String createLobby(String name) {
        String lobbyId = IdGenerator.generateGameId();
        Lobby newLobby = new Lobby(name, lobbyId);

        lobbyRepository.addLobby(newLobby);
        sessionRegistry.registerSession(new Session(lobbyId));

        return lobbyId;
    }

    public Lobby getLobby(String lobbyId) {
        return lobbyRepository.getLobby(lobbyId);
    }

    public void deleteLobby(String lobbyId, boolean preserveSession) {
        boolean isEmpty =
                lobbyRepository.getLobby(lobbyId).getParticipants().stream().noneMatch(LobbyParticipant::isActive);

        if (!isEmpty) {
            throw new LobbyNotEmptyException(lobbyId);
        }

        lobbyRepository.removeLobby(lobbyId);

        if (preserveSession) {
            sessionRegistry.clearConnectionId(lobbyId);
        } else {
            sessionRegistry.removeSession(lobbyId);
        }

        log.info("Lobby deleted: {}, Session preserved: {}", lobbyId, preserveSession);
    }

    public void markLobbyAsAbandoned(String lobbyId) {
        getLobby(lobbyId).markAsAbandoned();
    }

    public void markLobbyAsTransitioning(String lobbyId) {
        getLobby(lobbyId).markAsTransitioning();
    }

    public LobbyParticipant registerParticipant(String lobbyId, String name, String id, boolean active) {
        int participantPosition = getLobby(lobbyId).getParticipants().size();
        LobbyParticipant newLobbyParticipant =
                new LobbyParticipant(name, "Funny title", id, active, participantPosition);
        getLobby(lobbyId).addParticipant(newLobbyParticipant);
        return newLobbyParticipant;
    }

    public void removeDisconnectedParticipant(String lobbyId, String participantId) {
        Lobby lobby = getLobby(lobbyId);
        lobby.removeParticipant(participantId);

        boolean isEmpty = lobby.getParticipants().stream().noneMatch(LobbyParticipant::isActive);

        if (isEmpty && lobby.isAbandoned()) {
            deleteLobby(lobbyId, false);
        } else if (isEmpty && lobby.isTransitioning()) {
            deleteLobby(lobbyId, true);
        }
    }

    public void changeParticipantPosition(String lobbyId, String participantId, int newPosition) {
        getLobby(lobbyId)
                .getParticipant(participantId)
                .orElseThrow(() -> new CannotIdentifyPlayer(
                        "Participant ID: " + participantId + ", didn't match any participants", 400))
                .setPosition(newPosition);
    }

    public void createGame(String lobbyId) {
        Lobby lobby = getLobby(lobbyId);
        List<Player> players = getLobby(lobbyId).getParticipants().stream()
                .map(Player::fromParticipant)
                .toList();

        gameService.createGame(lobby.getName(), lobbyId, players);
    }
}
