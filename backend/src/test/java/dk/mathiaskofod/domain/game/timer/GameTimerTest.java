package dk.mathiaskofod.domain.game.timer;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.time.Instant;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.closeTo;
import static org.hamcrest.Matchers.is;


class GameTimerTest {

    private GameTimer timer;

    @BeforeEach
    void setUp() {
        timer = new GameTimer();
    }

    @DisplayName("Timer needs to be started before performing any actions")
    @Nested
    class TimerNotStartedTests {

        @Test
        @DisplayName("Getting time before starting timer throws exception")
        void getTimeBeforeStartThrowsException() {

            //Arrange-Act-Assert
            assertThat(timer.getTime(), is(Duration.ZERO));
        }

        @Test
        @DisplayName("Pausing before starting timer does nothing")
        void pausingBeforeStartingTimerDoesNothing() {

            //Act
            timer.pause();
            Instant pauseStartTime = timer.pauseStartTime;

            //Assert
            assertThat(pauseStartTime, is((Instant) null));

        }


    }

    @DisplayName("Timer is showing correct elapsed time")
    @Nested
    class TimerElapsedTimeTests {

        double marginOfError = 50.0;

        @Test
        @DisplayName("Timer returns elapsed time after being started")
        void getTimeAfterStartReturnsElapsedTime() throws InterruptedException {

            //Arrange
            long expectedElapsedTime = 250;

            //Act
            timer.start();
            Thread.sleep(expectedElapsedTime);

            Duration elapsed = timer.getTime();

            //Assert
            assertThat((double) elapsed.toMillis(), closeTo(expectedElapsedTime, marginOfError));
        }

        @Test
        @DisplayName("Pausing and resuming timer works correctly")
        void pausingAndResumingTimerWorksCorrectly() throws InterruptedException {

            //Arrange
            long timeIncrements = 150;
            long expectedElapsedTime = 300;

            //Act
            timer.start();
            Thread.sleep(timeIncrements);

            timer.pause();
            Thread.sleep(timeIncrements); // This sleep simulates the pause duration

            timer.resume();
            Thread.sleep(timeIncrements);

            Duration elapsed = timer.getTime();

            //Assert
            assertThat((double) elapsed.toMillis(), closeTo(expectedElapsedTime, marginOfError));
        }

    }


}