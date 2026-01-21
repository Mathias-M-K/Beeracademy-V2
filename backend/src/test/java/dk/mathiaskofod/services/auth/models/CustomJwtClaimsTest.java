package dk.mathiaskofod.services.auth.models;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.is;

class CustomJwtClaimsTest {

    @Test
    @DisplayName("CustomJwtClaims.GAME_ID is equal to 'GAME_ID'")
    void test(){

        //Arrange
        String claimName = CustomJwtClaims.GAME_ID.getName();
        String expectedName = "GAME_ID";

        //Act-Assert
        assertThat(claimName,is(expectedName));
    }

}