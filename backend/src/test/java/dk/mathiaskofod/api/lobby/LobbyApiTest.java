package dk.mathiaskofod.api.lobby;

import static io.restassured.RestAssured.given;
import static io.restassured.RestAssured.when;
import static org.hamcrest.Matchers.equalTo;

import dk.mathiaskofod.services.auth.AuthenticationService;
import dk.mathiaskofod.services.lobby.LobbyService;
import dk.mathiaskofod.services.lobby.models.Lobby;
import dk.mathiaskofod.services.lobby.models.LobbyParticipant;
import io.quarkus.test.InjectMock;
import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

@QuarkusTest
class LobbyApiTest {

    @InjectMock
    LobbyService lobbyService;

    @InjectMock
    AuthenticationService authenticationService;

    private final String url = "api/lobbies";

    @Test
    @DisplayName("Can create new game")
    void canCreateNewGame() {

        // Arrange
        given().queryParam("name", "tst")
                .when()
                .post(url)
                .then()
                .statusCode(202)
                .cookie("session_jwt");
    }

    @Test
    @DisplayName("Can't create game with empty name")
    void canCreateNewGameWithSessionJwt() {

        when().post(url + "?name=").then().statusCode(400);
    }

    @Test
    @DisplayName("All lobbies can be fetched")
    void allLobbiesCanBeFetched() {

        // Arrange
        String lobbyId = "123123123";
        Lobby lobby = new Lobby("TestLobby", lobbyId);
        Mockito.when(lobbyService.getLobby(lobbyId)).thenReturn(lobby);

        // Act
        when().get(url + "/" + lobbyId)
                .then()
                .statusCode(200)
                .body("id", equalTo(lobbyId))
                .body("name", equalTo("TestLobby"));
    }

    @Test
    @DisplayName("Player can register to lobby")
    void canRegisterToLobby() {

        // Arrange
        String lobbyId = "123456789";
        LobbyParticipant participant = new LobbyParticipant("TestPlayer", "Apprentice", "participantId");
        Mockito.when(lobbyService.registerParticipant("TestPlayer", lobbyId)).thenReturn(participant);

        when().post(url + "/123456789/register?participantName=TestPlayer")
                .then()
                .statusCode(200)
                .cookie("session_jwt");
    }
}
