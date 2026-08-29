package dk.mathiaskofod.api.party;

import static io.restassured.RestAssured.given;
import static io.restassured.RestAssured.when;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import dk.mathiaskofod.api.party.models.PartyDto;
import dk.mathiaskofod.api.party.models.PartyParticipantDto;
import dk.mathiaskofod.common.dto.session.SessionDto;
import dk.mathiaskofod.services.party.PartyService;
import dk.mathiaskofod.services.party.exceptions.PartyNotFoundException;
import dk.mathiaskofod.services.party.models.PartyState;
import io.quarkus.test.InjectMock;
import io.quarkus.test.junit.QuarkusTest;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

@QuarkusTest
class PartyApiTest {

    @InjectMock
    PartyService partyService;

    private final String url = "api/parties";

    private static final String PARTY_ID = "123456789";

    private static PartyDto partyDto() {
        PartyParticipantDto participant = new PartyParticipantDto("Alice", "alice", new SessionDto(true, true));
        return new PartyDto(PartyState.LOBBY, "Beer Party", PARTY_ID, List.of(participant), new SessionDto(true, false));
    }

    @Test
    @DisplayName("A party can be fetched")
    void partyCanBeFetched() {

        // Arrange
        Mockito.when(partyService.getPartyState(PARTY_ID)).thenReturn(partyDto());

        // Act
        PartyDto party = when().get(url + "/" + PARTY_ID)
                .then()
                .statusCode(200)
                .extract()
                .as(PartyDto.class);

        // Assert
        assertThat(party.partyState(), is(PartyState.LOBBY));
        assertThat(party.name(), is("Beer Party"));
        assertThat(party.id(), is(PARTY_ID));
        assertThat(party.participants().getFirst().name(), is("Alice"));
        assertThat(party.session().isClaimed(), is(true));
    }

    @Test
    @DisplayName("A dashed party id is normalised before it reaches the service")
    void dashedPartyIdIsNormalised() {

        // Arrange
        Mockito.when(partyService.getPartyState(PARTY_ID)).thenReturn(partyDto());

        // Act
        when().get(url + "/123-456-789").then().statusCode(200);

        // Assert
        verify(partyService).getPartyState(PARTY_ID);
    }

    @Test
    @DisplayName("A malformed party id is rejected before it reaches the service")
    void malformedPartyIdIsRejected() {

        // Act
        when().get(url + "/abc").then().statusCode(400);

        // Assert
        verify(partyService, never()).getPartyState(anyString());
    }

    @Test
    @DisplayName("An unknown party returns 404")
    void unknownPartyReturnsNotFound() {

        // Arrange
        Mockito.when(partyService.getPartyState(PARTY_ID)).thenThrow(new PartyNotFoundException(PARTY_ID));

        // Act & Assert
        given().when()
                .get(url + "/" + PARTY_ID)
                .then()
                .statusCode(404)
                .body("exception", equalTo("PartyNotFoundException"));
    }
}
