package dk.mathiaskofod.api.game;

import static io.restassured.RestAssured.given;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.*;

import dk.mathiaskofod.common.dto.game.GameDto;
import dk.mathiaskofod.common.dto.player.PlayerDto;
import dk.mathiaskofod.domain.game.player.Player;
import dk.mathiaskofod.domain.game.player.models.Stats;
import dk.mathiaskofod.services.game.GameService;
import dk.mathiaskofod.services.game.id.generator.IdGenerator;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@QuarkusTest
class GameApiTest {

    @Inject
    GameService gameService;

    /**
     * Creates a game directly via {@link GameService} (no session registered), mirroring what the old {@code POST
     * /api/games} endpoint did. A game created this way is unclaimed, so the claim-game/claim-player endpoints can be
     * exercised.
     *
     * @return the generated game ID
     */
    private String createGameWithTwoPlayers(String name) {
        String partyId = IdGenerator.generatePartyId();
        List<Player> players =
                List.of(new Player("Alice", "alice", 2, true, new Stats()), new Player("Bob", "bob", 3, true, new Stats()));
        gameService.createGame(name, partyId, players);
        return partyId;
    }

    @DisplayName("Get game returns game details")
    @Test
    void getGameReturnsDetails() {
        // Arrange
        String partyId = createGameWithTwoPlayers("Get Game Test");

        // Act
        GameDto response = given().pathParam("partyId", partyId)
                .when()
                .get("/api/games/{partyId}")
                .then()
                .statusCode(200)
                .extract()
                .as(GameDto.class);

        // Assert
        assertThat(response.partyId(), is(partyId));
        assertThat(response.name(), is("Get Game Test"));
    }

    @DisplayName("Claim game returns JWT in cookie")
    @Test
    void claimGameReturnsCookie() {
        // Arrange
        String partyId = createGameWithTwoPlayers("Claim Game Test");

        // Act & Assert
        given().pathParam("partyId", partyId)
                .when()
                .get("/api/games/{partyId}/claim")
                .then()
                .statusCode(200)
                .cookie("session_jwt", is(notNullValue()));
    }

    @DisplayName("Get players in game returns player list")
    @Test
    void getPlayersInGameReturnsList() {
        // Arrange
        String partyId = createGameWithTwoPlayers("Players List Test");

        // Act
        List<PlayerDto> response = given().pathParam("partyId", partyId)
                .when()
                .get("/api/games/{partyId}/players")
                .then()
                .statusCode(200)
                .extract()
                .body()
                .jsonPath()
                .getList(".", PlayerDto.class);

        // Assert
        assertThat(response.size(), is(2));
        assertThat(response.getFirst().name(), anyOf(is("Alice"), is("Bob")));
    }

    @DisplayName("Claim player returns JWT in cookie")
    @Test
    void claimPlayerReturnsCookie() {
        // Arrange
        String partyId = createGameWithTwoPlayers("Claim Player Test");

        List<PlayerDto> players = given().pathParam("partyId", partyId)
                .get("/api/games/{partyId}/players")
                .then()
                .statusCode(200)
                .extract()
                .jsonPath()
                .getList(".", PlayerDto.class);

        String playerId = players.getFirst().id();

        // Act & Assert
        given().pathParam("partyId", partyId)
                .pathParam("playerId", playerId)
                .when()
                .get("/api/games/{partyId}/players/{playerId}/claim")
                .then()
                .statusCode(200)
                .cookie("session_jwt", is(notNullValue()));
    }

    @DisplayName("Get game report returns report")
    @Test
    void getGameReportReturnsReport() {
        // Arrange
        String partyId = createGameWithTwoPlayers("Game Report Test");

        // Act & Assert
        given().pathParam("partyId", partyId)
                .when()
                .get("/api/games/{partyId}/reports/game")
                .then()
                .statusCode(200)
                .body("beersConsumed", hasSize(2));
    }

    @DisplayName("Get player reports returns list")
    @Test
    void getPlayerReportsReturnsList() {
        // Arrange
        String partyId = createGameWithTwoPlayers("Player Reports Test");

        // Act & Assert
        given().pathParam("partyId", partyId)
                .when()
                .get("/api/games/{partyId}/reports/players")
                .then()
                .statusCode(200)
                .body("$", hasSize(2));
    }

    @DisplayName("Get time report returns report")
    @Test
    void getTimeReportReturnsReport() {
        // Arrange
        String partyId = createGameWithTwoPlayers("Time Report Test");

        // Act & Assert
        given().pathParam("partyId", partyId)
                .when()
                .get("/api/games/{partyId}/reports/time")
                .then()
                .statusCode(200)
                .body("gameTimeReport", is(notNullValue()))
                .body("playerTimeReport", is(notNullValue()));
    }
}
