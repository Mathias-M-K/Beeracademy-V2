package dk.mathiaskofod.domain.game.timer;

import dk.mathiaskofod.domain.game.timer.models.TimerState;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.is;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;

public class TimerTest {


    @DisplayName("Timer stats")
    @Nested
    class TimerStats {

        Timer timer;

        @BeforeEach
        void setUp() {
            timer = new Timer();
        }

        @Test
        @DisplayName("Should be NOT_STARTED when created")
        void shouldBeNotStartedWhenCreated() {
            //Assert
            assertThat(timer.state, is(TimerState.NOT_STARTED));
        }

        @Test
        @DisplayName("Should start without exceptions")
        void shouldStartWithoutExceptions() {

            //Act
            timer.start();

            //Assert
            assertThat(timer.state, is(TimerState.RUNNING));
        }

        @Test
        @DisplayName("Should pause without exceptions")
        void shouldPauseWithoutExceptions() {

            //Arrange
            timer.start();

            //Act & Assert
            assertDoesNotThrow(() -> timer.pause());
            assertThat(timer.state, is(TimerState.PAUSED));
        }

        @Test
        @DisplayName("After reset, timer keeps previous state")
        void afterResetTimerShouldBeRunning() {

            //Arrange
            timer.start();
            timer.pause();
            TimerState expectedStateBeforeReset = timer.state;

            //Act
            timer.reset();

            //Assert
            assertThat(timer.state, is(expectedStateBeforeReset));
        }

        @Test
        @DisplayName("After reset, should be able to pause and resume without exceptions")
        void afterResetShouldBeAbleToPauseAndResumeWithoutExceptions() {
            //Arrange
            timer.start();
            timer.pause();
            timer.reset();

            //Act & Assert
            assertDoesNotThrow(() -> timer.pause());
            assertThat(timer.state, is(TimerState.PAUSED));

            assertDoesNotThrow(() -> timer.resume());
            assertThat(timer.state, is(TimerState.RUNNING));
        }

    }
}
