package dk.mathiaskofod.services.game;

import dk.mathiaskofod.common.dto.game.GameDto;
import dk.mathiaskofod.common.dto.player.PlayerDto;
import dk.mathiaskofod.common.dto.session.SessionDto;
import dk.mathiaskofod.domain.game.Game;
import dk.mathiaskofod.domain.game.player.Player;
import dk.mathiaskofod.services.session.exceptions.ResourceClaimException;
import dk.mathiaskofod.services.session.repository.Session;
import dk.mathiaskofod.services.session.repository.SessionRegistry;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.util.List;
import lombok.extern.slf4j.Slf4j;

/**
 * Unifies Game state ({@link GameService}) with Session info ({@link SessionRegistry}) — the two independent sources of
 * truth the API needs together.
 *
 * <p>Owns both the read-models (assembling {@link GameDto}/{@link PlayerDto} with session data) and the session-claim
 * commands. {@link GameService} stays a pure command/domain service with no session knowledge; this is the layer that
 * joins the two. JWT minting stays in the API layer ({@code GameApi}), mirroring the
 * {@code LobbyApi}/{@code LobbyService} split.
 */
@Slf4j
@ApplicationScoped
public class GameSessionService {

    @Inject
    GameService gameService;

    @Inject
    SessionRegistry sessionRegistry;

    public GameDto getGameView(String partyId) {

        Game game = gameService.getGame(partyId);

        SessionDto gameSession =
                sessionRegistry.getSession(partyId).map(SessionDto::create).orElseGet(SessionDto::createEmpty);

        List<PlayerDto> playerDtos = assemblePlayers(game);

        return GameDto.create(game, gameSession, playerDtos, game.getDeck());
    }

    public List<PlayerDto> getPlayerViews(String partyId) {
        return assemblePlayers(gameService.getGame(partyId));
    }

    public void claimGame(String partyId) {

        if (!gameService.gameExists(partyId)) {
            throw new ResourceClaimException("Game does not exist");
        }

        if (sessionRegistry.getSession(partyId).isPresent()) {
            String msg = String.format("The game with id %s is already claimed.", partyId);
            throw new ResourceClaimException(msg);
        }

        sessionRegistry.registerSession(new Session(partyId));
    }

    public Player claimPlayer(String partyId, String playerId) {

        if (!gameService.gameExists(partyId)) {
            throw new ResourceClaimException("Game does not exist");
        }

        if (sessionRegistry.getSession(playerId).isPresent()) {
            String msg =
                    String.format("Player with ID: %s, from game: %s, has already been claimed.", playerId, partyId);
            throw new ResourceClaimException(msg);
        }

        Player player = gameService.getPlayer(partyId, playerId);

        sessionRegistry.registerSession(new Session(playerId));

        return player;
    }

    private List<PlayerDto> assemblePlayers(Game game) {
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
}
