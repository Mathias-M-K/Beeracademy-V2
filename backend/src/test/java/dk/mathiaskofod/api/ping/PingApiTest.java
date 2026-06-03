package dk.mathiaskofod.api.ping;

import static io.restassured.RestAssured.when;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.is;

import dk.mathiaskofod.api.ping.models.Pong;
import dk.mathiaskofod.services.environment.models.Environment;
import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@QuarkusTest
class PingApiTest {

    @DisplayName("Pong is returned")
    @Test
    void pongIsReturned() {

        // Arrange
        String url = "api/ping";

        // Act
        Pong pong = when().get(url).then().statusCode(200).extract().as(Pong.class);

        // Assert
        assertThat(pong.environment(), is(Environment.TEST));
    }
}
