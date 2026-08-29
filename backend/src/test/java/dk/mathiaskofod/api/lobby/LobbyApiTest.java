package dk.mathiaskofod.api.lobby;

import static io.restassured.RestAssured.given;
import static io.restassured.RestAssured.when;
import static org.hamcrest.Matchers.equalTo;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import dk.mathiaskofod.services.auth.AuthenticationService;
import dk.mathiaskofod.services.lobby.LobbyService;
import dk.mathiaskofod.services.lobby.models.Lobby;
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
        String partyId = "123123123";
        Lobby lobby = new Lobby("TestLobby", partyId);
        Mockito.when(lobbyService.getLobby(partyId)).thenReturn(lobby);

        // Act
        when().get(url + "/" + partyId)
                .then()
                .statusCode(200)
                .body("partyId", equalTo(partyId))
                .body("name", equalTo("TestLobby"));
    }

    @Test
    @DisplayName("Player can register to lobby")
    void canRegisterToLobby() {

        // Arrange

        when().post(url + "/123456789/register?participantName=TestPlayer")
                .then()
                .statusCode(200)
                .cookie("session_jwt");
    }

    @Test
    @DisplayName("Player can register to lobby using the dashed display form of the party id")
    void canRegisterToLobbyWithDashedPartyId() {

        // Arrange
        String dashedPartyId = "123-456-789";

        // Act
        when().post(url + "/" + dashedPartyId + "/register?participantName=TestPlayer")
                .then()
                .statusCode(200)
                .cookie("session_jwt");

        // Assert
        verify(lobbyService).getLobby("123456789");
    }

    @Test
    @DisplayName("Registering with a malformed party id is rejected")
    void cannotRegisterToLobbyWithMalformedPartyId() {

        // Arrange
        String malformedPartyId = "abc";

        // Act & Assert
        when().post(url + "/" + malformedPartyId + "/register?participantName=TestPlayer")
                .then()
                .statusCode(400);


        verify(lobbyService, never()).getLobby(anyString());
    }
}
