package dk.mathiaskofod.services.game;

import dk.mathiaskofod.services.game.exceptions.GameNotFoundException;
import dk.mathiaskofod.domain.game.models.GameId;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertThrows;


@ExtendWith(MockitoExtension.class)
class GameServiceTest {

    @InjectMocks
    private GameService gameServiceMock;

    @BeforeEach
    void setUp() {}

    @Nested
    class GetGame {

        @Test
        @DisplayName("Getting a non-existing game should return null")
        void getNonExistingGame() {

            //Arrange
            GameId gameId = new GameId("123abc123");

            //Act - Assert
            assertThrows(GameNotFoundException.class, () -> gameServiceMock.getGame(gameId));

        }

    }


}