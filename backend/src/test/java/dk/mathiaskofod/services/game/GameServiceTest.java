package dk.mathiaskofod.services.game;

import dk.mathiaskofod.services.game.exceptions.GameNotFoundException;
import io.quarkus.redis.datasource.RedisDataSource;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertThrows;


@ExtendWith(MockitoExtension.class)
class GameServiceTest {

    @Mock
    RedisDataSource redisDataSource;

    @InjectMocks
    private GameService gameServiceMock;

    @Nested
    class GetGame {

        @Test
        @DisplayName("Getting a non-existing game should return null")
        void getNonExistingGame() {

            //Arrange
            String gameId = "123abc123";

            //Act - Assert
            assertThrows(GameNotFoundException.class, () -> gameServiceMock.getGame(gameId));

        }

    }


}