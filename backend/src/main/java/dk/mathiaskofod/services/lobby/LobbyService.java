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
import dk.mathiaskofod.services.lobby.models.Lobby;
import dk.mathiaskofod.services.lobby.models.LobbyParticipant;
import dk.mathiaskofod.services.lobby.repository.LobbyRepository;
import dk.mathiaskofod.services.session.exceptions.ResourceClaimException;
import dk.mathiaskofod.services.session.repository.Session;
import dk.mathiaskofod.services.session.repository.SessionRegistry;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.util.List;

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

        return lobbyId;
    }

    /**
     * Fetch lobby
     *
     * @return fetches lobby
     */
    public Lobby getLobby(String lobbyId) {
        return lobbyRepository.getLobby(lobbyId);
    }

    /**
     * Registers new lobby
     *
     * @param participantName Name of the participant, will persist as Player name
     * @param lobbyId Lobby ID, will persist as Game ID
     * @return Participant ID, which will persist as Player ID
     */
    public LobbyParticipant registerParticipant(String participantName, String lobbyId) {
        String participantId = IdGenerator.generatePlayerId();
        LobbyParticipant participant = new LobbyParticipant(participantName, "Fancy title", participantId);
        getLobby(lobbyId).addParticipant(participant);
        return participant;
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
