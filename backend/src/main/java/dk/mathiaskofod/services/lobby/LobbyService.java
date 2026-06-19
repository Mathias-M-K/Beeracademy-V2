package dk.mathiaskofod.services.lobby;

import dk.mathiaskofod.api.game.models.CreateGameRequest;
import dk.mathiaskofod.common.dto.game.GameDto;
import dk.mathiaskofod.common.dto.player.PlayerDto;
import dk.mathiaskofod.common.dto.session.SessionDto;
import dk.mathiaskofod.domain.game.Game;
import dk.mathiaskofod.domain.game.player.Player;
import dk.mathiaskofod.services.auth.AuthenticationService;
import dk.mathiaskofod.services.game.GameService;
import dk.mathiaskofod.services.game.id.generator.IdGenerator;
import dk.mathiaskofod.services.lobby.exceptions.LobbyNotEmptyException;
import dk.mathiaskofod.services.lobby.models.Lobby;
import dk.mathiaskofod.services.lobby.models.LobbyParticipant;
import dk.mathiaskofod.services.lobby.repository.LobbyRepository;
import dk.mathiaskofod.services.session.exceptions.ResourceClaimException;
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
    AuthenticationService authenticationService;

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
        Session clientSession = new Session(lobbyId);
        sessionRegistry.registerSession(clientSession);

        return lobbyId;
    }

    public void deleteLobby(String lobbyId) {
        boolean isEmpty = lobbyRepository.getLobby(lobbyId).getParticipants().isEmpty();
        if (!isEmpty) {
            throw new LobbyNotEmptyException(lobbyId);
        }

        lobbyRepository.removeLobby(lobbyId);
        sessionRegistry.removeSession(lobbyId);

        log.info("Lobby deleted: {}", lobbyId);
    }

    public void markLobbyAbandoned(String lobbyId) {
        getLobby(lobbyId).markAbandoned();
    }

    /**
     * Fetch lobby
     *
     * @return fetches lobby
     */
    public Lobby getLobby(String lobbyId) {
        return lobbyRepository.getLobby(lobbyId);
    }

    public LobbyParticipant registerConnectedParticipant(String lobbyId, String name, String id) {
        LobbyParticipant newLobbyParticipant = new LobbyParticipant(name, "Funny title", id);
        getLobby(lobbyId).addParticipant(newLobbyParticipant);
        return newLobbyParticipant;
    }

    public void removeDisconnectedParticipant(String lobbyId, String participantId) {
        Lobby lobby = getLobby(lobbyId);
        lobby.removeParticipant(participantId);

        if (lobby.getParticipants().isEmpty() && lobby.isAbandoned()) {
            deleteLobby(lobbyId);
        }
    }

    @Deprecated(forRemoval = true)
    public String createGame(CreateGameRequest createGameRequest) {

        List<Player> newPlayers = createGameRequest.players().stream()
                .map(createPlayerDto -> Player.create(
                        createPlayerDto.playerName(), createPlayerDto.sipsInABeer(), createPlayerDto.canDrawChugCard()))
                .toList();

        return gameService.createGame(createGameRequest.name(), newPlayers);
    }

    @Deprecated(forRemoval = true)
    public GameDto getGame(String gameId) {

        Game game = gameService.getGame(gameId);

        SessionDto gameSession =
                sessionRegistry.getSession(gameId).map(SessionDto::create).orElseGet(SessionDto::createEmpty);

        List<PlayerDto> playerDtos = getPlayerDtos(game);

        return GameDto.create(game, gameSession, playerDtos);
    }

    @Deprecated(forRemoval = true)
    private List<PlayerDto> getPlayerDtos(Game game) {
        return game.getPlayers().stream()
                .map(player -> {
                    SessionDto playerSessionDto = sessionRegistry
                            .getSession(player.id())
                            .map(SessionDto::create)
                            .orElseGet(SessionDto::createEmpty);

                    return PlayerDto.create(player, playerSessionDto);
                })
                .toList();
    }

    @Deprecated(forRemoval = true)
    public List<PlayerDto> getPlayerDtos(String gameId) {
        Game game = gameService.getGame(gameId);
        return getPlayerDtos(game);
    }

    @Deprecated(forRemoval = true)
    public String claimGame(String gameId) {

        if (!gameService.gameExists(gameId)) {
            throw new ResourceClaimException("Game does not exist");
        }

        if (sessionRegistry.getSession(gameId).isPresent()) {
            String msg = String.format("The game with id %s is already claimed.", gameId);
            throw new ResourceClaimException(msg);
        }

        sessionRegistry.registerSession(new Session(gameId));

        return authenticationService.createGameClientToken(gameId);
    }

    @Deprecated(forRemoval = true)
    public String claimPlayer(String gameId, String playerId) {

        if (!gameService.gameExists(gameId)) {
            throw new ResourceClaimException("Game does not exist");
        }

        if (sessionRegistry.getSession(playerId).isPresent()) {
            String msg =
                    String.format("Player with ID: %s, from game: %s, has already been claimed.", playerId, gameId);
            throw new ResourceClaimException(msg);
        }

        Player player = gameService.getPlayer(gameId, playerId);

        sessionRegistry.registerSession(new Session(playerId));

        return authenticationService.createPlayerClientToken(player.name(), gameId);
    }
}
