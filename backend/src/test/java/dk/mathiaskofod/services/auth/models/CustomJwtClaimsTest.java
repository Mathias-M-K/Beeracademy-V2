package dk.mathiaskofod.services.auth.models;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.is;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class CustomJwtClaimsTest {

    @Test
    @DisplayName("CustomJwtClaims.PARTY_ID is equal to 'PARTY_ID'")
    void test() {

        // Arrange
        String claimName = CustomJwtClaims.PARTY_ID.getName();
        String expectedName = "PARTY_ID";

        // Act-Assert
        assertThat(claimName, is(expectedName));
    }
}
