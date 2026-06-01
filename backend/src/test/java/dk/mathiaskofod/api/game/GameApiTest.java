package dk.mathiaskofod.api.game;

import static io.restassured.RestAssured.given;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.*;

import dk.mathiaskofod.api.game.models.CreateGameRequest;
import dk.mathiaskofod.api.game.models.CreatePlayerDto;
import dk.mathiaskofod.common.dto.game.GameDto;
import dk.mathiaskofod.common.dto.game.GameIdDto;
import dk.mathiaskofod.common.dto.player.PlayerDto;
import dk.mathiaskofod.services.lobby.LobbyService;
import io.quarkus.test.junit.QuarkusTest;
import io.restassured.http.ContentType;
import jakarta.inject.Inject;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@QuarkusTest
class GameApiTest {

    @Inject
    LobbyService lobbyService;

    private List<CreatePlayerDto> createTwoPlayers() {
        return List.of(new CreatePlayerDto("Alice", 2, true), new CreatePlayerDto("Bob", 3, true));
    }

    @DisplayName("Create game returns game ID")
    @Test
    void createGameReturnsId() {
        // Arrange
        CreateGameRequest request = new CreateGameRequest("Test Game", createTwoPlayers());

        // Act
        GameIdDto response = given().contentType(ContentType.JSON)
                .body(request)
                .when()
                .post("/api/games")
                .then()
                .statusCode(200)
                .extract()
                .as(GameIdDto.class);

        // Assert
        assertThat(response.gameId(), is(notNullValue()));
        assertThat(response.gameId().length(), is(9));
    }

    @DisplayName("Get game returns game details")
    @Test
    void getGameReturnsDetails() {
        // Arrange
        CreateGameRequest request = new CreateGameRequest("Get Game Test", createTwoPlayers());
        String gameId = given().contentType(ContentType.JSON)
                .body(request)
                .post("/api/games")
                .then()
                .statusCode(200)
                .extract()
                .path("gameId");

        // Act
        GameDto response = given().pathParam("gameId", gameId)
                .when()
                .get("/api/games/{gameId}")
                .then()
                .statusCode(200)
                .extract()
                .as(GameDto.class);

        // Assert
        assertThat(response.id(), is(gameId));
        assertThat(response.name(), is("Get Game Test"));
    }

    @DisplayName("Claim game returns JWT in cookie")
    @Test
    void claimGameReturnsCookie() {
        // Arrange
        CreateGameRequest request = new CreateGameRequest("Claim Game Test", createTwoPlayers());
        String gameId = given().contentType(ContentType.JSON)
                .body(request)
                .post("/api/games")
                .then()
                .statusCode(200)
                .extract()
                .path("gameId");

        // Act & Assert
        given().pathParam("gameId", gameId)
                .when()
                .get("/api/games/{gameId}/claim")
                .then()
                .statusCode(200)
                .cookie("session_jwt", is(notNullValue()));
    }

    @DisplayName("Get players in game returns player list")
    @Test
    void getPlayersInGameReturnsList() {
        // Arrange
        CreateGameRequest request = new CreateGameRequest("Players List Test", createTwoPlayers());
        String gameId = given().contentType(ContentType.JSON)
                .body(request)
                .post("/api/games")
                .then()
                .statusCode(200)
                .extract()
                .path("gameId");

        // Act
        List<PlayerDto> response = given().pathParam("gameId", gameId)
                .when()
                .get("/api/games/{gameId}/players")
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
        CreateGameRequest request = new CreateGameRequest("Claim Player Test", createTwoPlayers());
        String gameId = given().contentType(ContentType.JSON)
                .body(request)
                .post("/api/games")
                .then()
                .statusCode(200)
                .extract()
                .path("gameId");

        List<PlayerDto> players = given().pathParam("gameId", gameId)
                .get("/api/games/{gameId}/players")
                .then()
                .statusCode(200)
                .extract()
                .jsonPath()
                .getList(".", PlayerDto.class);

        String playerId = players.getFirst().id();

        // Act & Assert
        given().pathParam("gameId", gameId)
                .pathParam("playerId", playerId)
                .when()
                .get("/api/games/{gameId}/players/{playerId}/claim")
                .then()
                .statusCode(200)
                .cookie("session_jwt", is(notNullValue()));
    }

    @DisplayName("Get game report returns report")
    @Test
    void getGameReportReturnsReport() {
        // Arrange
        CreateGameRequest request = new CreateGameRequest("Game Report Test", createTwoPlayers());
        String gameId = given().contentType(ContentType.JSON)
                .body(request)
                .post("/api/games")
                .then()
                .statusCode(200)
                .extract()
                .path("gameId");

        // Act & Assert
        given().pathParam("gameId", gameId)
                .when()
                .get("/api/games/{gameId}/reports/game")
                .then()
                .statusCode(200)
                .body("beersConsumed", hasSize(2));
    }

    @DisplayName("Get player reports returns list")
    @Test
    void getPlayerReportsReturnsList() {
        // Arrange
        CreateGameRequest request = new CreateGameRequest("Player Reports Test", createTwoPlayers());
        String gameId = given().contentType(ContentType.JSON)
                .body(request)
                .post("/api/games")
                .then()
                .statusCode(200)
                .extract()
                .path("gameId");

        // Act & Assert
        given().pathParam("gameId", gameId)
                .when()
                .get("/api/games/{gameId}/reports/players")
                .then()
                .statusCode(200)
                .body("$", hasSize(2));
    }

    @DisplayName("Get time report returns report")
    @Test
    void getTimeReportReturnsReport() {
        // Arrange
        CreateGameRequest request = new CreateGameRequest("Time Report Test", createTwoPlayers());
        String gameId = given().contentType(ContentType.JSON)
                .body(request)
                .post("/api/games")
                .then()
                .statusCode(200)
                .extract()
                .path("gameId");

        // Act & Assert
        given().pathParam("gameId", gameId)
                .when()
                .get("/api/games/{gameId}/reports/time")
                .then()
                .statusCode(200)
                .body("gameTimeReport", is(notNullValue()))
                .body("playerTimeReport", is(notNullValue()));
    }
}
