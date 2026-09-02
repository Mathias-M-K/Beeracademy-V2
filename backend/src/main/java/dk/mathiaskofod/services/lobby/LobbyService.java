package dk.mathiaskofod.services.lobby;

import dk.mathiaskofod.domain.game.player.Player;
import dk.mathiaskofod.services.game.GameService;
import dk.mathiaskofod.services.game.id.generator.IdGenerator;
import dk.mathiaskofod.services.lobby.exceptions.LobbyNotEmptyException;
import dk.mathiaskofod.services.lobby.models.Lobby;
import dk.mathiaskofod.services.lobby.models.LobbyParticipant;
import dk.mathiaskofod.services.lobby.repository.LobbyRepository;
import dk.mathiaskofod.services.session.exceptions.CannotIdentifyPlayerException;
import dk.mathiaskofod.services.session.repository.Session;
import dk.mathiaskofod.services.session.repository.SessionRegistry;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.Comparator;
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
     * Creates a lobby and returns its party-id
     *
     * @param name Name of lobby, will persist as the Game name
     * @return the party ID — identifies this group of players through both the lobby and the game phase
     */
    public String createLobby(String name) {
        String partyId = IdGenerator.generatePartyId();
        Lobby newLobby = new Lobby(name, partyId);

        lobbyRepository.addLobby(newLobby);
        sessionRegistry.registerSession(new Session(partyId));

        return partyId;
    }

    public Lobby getLobby(String partyId) {
        return lobbyRepository.getLobby(partyId);
    }

    public void deleteLobby(String partyId, boolean preserveSession) {
        boolean isEmpty = lobbyRepository
                .getLobby(partyId)
                .getParticipants()
                .stream()
                .noneMatch(LobbyParticipant::isActive);

        if (!isEmpty) {
            throw new LobbyNotEmptyException(partyId);
        }

        lobbyRepository.removeLobby(partyId);

        if (preserveSession) {
            sessionRegistry.clearConnectionId(partyId);
        } else {
            sessionRegistry.removeSession(partyId);
        }

        log.info("Lobby deleted: {}, Session preserved: {}", partyId, preserveSession);
    }

    public boolean lobbyExist(String partyId){
        return lobbyRepository.lobbyExist(partyId);
    }

    public void markLobbyAsAbandoned(String partyId) {
        getLobby(partyId).markAsAbandoned();
    }

    public void markLobbyAsTransitioning(String partyId) {
        getLobby(partyId).markAsTransitioning();
    }

    public LobbyParticipant registerParticipant(String partyId, String name, String id, boolean active) {
        int participantPosition = getLobby(partyId).getParticipants().size();
        LobbyParticipant newLobbyParticipant = new LobbyParticipant(name, "Funny title", id, active, participantPosition);
        getLobby(partyId).addParticipant(newLobbyParticipant);
        return newLobbyParticipant;
    }

    public void removeDisconnectedParticipant(String partyId, String participantId) {
        Lobby lobby = getLobby(partyId);
        lobby.removeParticipant(participantId);

        boolean isEmpty = lobby.getParticipants().stream().noneMatch(LobbyParticipant::isActive);

        if (isEmpty && lobby.isAbandoned()) {
            deleteLobby(partyId, false);
        } else if (isEmpty && lobby.isTransitioning()) {
            deleteLobby(partyId, true);
        }
    }

    public void changeParticipantPosition(String partyId, String participantId, int newPosition) {
        getLobby(partyId)
                .getParticipant(participantId)
                .orElseThrow(() -> new CannotIdentifyPlayerException(
                        "Participant ID: " + participantId + ", didn't match any participants", 400))
                .setPosition(newPosition);
    }

    public void createGame(String partyId) {
        Lobby lobby = getLobby(partyId);
        List<Player> players = getLobby(partyId).getParticipants().stream()
                .sorted(Comparator.comparingInt(LobbyParticipant::getPosition))
                .map(LobbyParticipant::toPlayer)
                .toList();

        gameService.createGame(lobby.getName(), partyId, players);
    }
}
