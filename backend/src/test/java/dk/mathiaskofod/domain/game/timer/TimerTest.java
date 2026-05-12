package dk.mathiaskofod.domain.game.timer;

import dk.mathiaskofod.domain.game.timer.models.TimerState;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.nullValue;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;

public class TimerTest {

    // A fixed "now" used across all clock-based tests
    private static final Instant FAKE_INSTANT_NOW = Instant.parse("2024-01-01T00:00:10Z");
    private static final Clock FIXED_CLOCK = Clock.fixed(FAKE_INSTANT_NOW, ZoneOffset.UTC);

    @DisplayName("Timer stats")
    @Nested
    class TimerStats {

        Timer timer;

        @BeforeEach
        void setUp() {
            // State tests don't care about time — use real clock
            timer = new Timer();
        }

        @DisplayName("Timer state")
        @Nested
        class TimerStateTest {

            @Test
            @DisplayName("Should be NOT_STARTED on creation")
            void shouldBeNotStartedWhenCreated() {

                assertThat(timer.getState(), is(TimerState.NOT_STARTED));
            }

            @Test
            @DisplayName("Should be RUNNING after start")
            void shouldBeRunningAfterStart() {

                // Arrange + act
                timer.start();

                // Assert
                assertThat(timer.getState(), is(TimerState.RUNNING));
            }

            @Test
            @DisplayName("Should be PAUSED after pause")
            void shouldPauseWithoutExceptions() {

                // Arrange + act
                timer.start();
                timer.pause();

                // Assert
                assertThat(timer.getState(), is(TimerState.PAUSED));
            }
        }

        @DisplayName("Reset")
        @Nested
        class Reset {

            @Test
            @DisplayName("After reset, timer keeps previous state")
            void afterResetTimerShouldKeepPreviousState() {
                timer.start();
                timer.pause();
                TimerState expectedStateBeforeReset = timer.state;

                timer.reset();

                assertThat(timer.state, is(expectedStateBeforeReset));
            }

            @Test
            @DisplayName("After reset, should be able to pause and resume without exceptions")
            void afterResetShouldBeAbleToPauseAndResumeWithoutExceptions() {
                timer.start();
                timer.pause();
                timer.reset();

                assertDoesNotThrow(() -> timer.pause());
                assertThat(timer.state, is(TimerState.PAUSED));

                assertDoesNotThrow(() -> timer.resume());
                assertThat(timer.state, is(TimerState.RUNNING));
            }
        }

        @DisplayName("Pause")
        @Nested
        class Pause {

            @Test
            @DisplayName("Timer can't be paused if it isn't running")
            void shouldNotBeAbleToPauseIfNotRunning() {
                TimerState timerState = timer.state;
                timer.pause();
                assertThat(timerState, is(TimerState.NOT_STARTED));
            }

            @Test
            @DisplayName("Timer can be paused if it's running")
            void shouldBeAbleToPauseIfRunning() {
                timer.start();
                TimerState timerStateBefore = timer.state;

                timer.pause();
                TimerState timerStateAfter = timer.state;

                assertThat(timerStateBefore, is(TimerState.RUNNING));
                assertThat(timerStateAfter, is(TimerState.PAUSED));
            }

            @Test
            @DisplayName("Total pause time for a timer that haven't been started is zero")
            void totalPauseTimeShouldBeZero() {

                // Arrange + act
                Duration totalPauseTime = timer.getTotalPauseDuration();

                // Assert
                assertThat(totalPauseTime, is(Duration.ZERO));
            }
        }

        @DisplayName("Resume")
        @Nested
        class Resume {

            @Test
            @DisplayName("Timer can't be resumed if it isn't paused")
            void shouldNotBeAbleToResumeIfNotPaused() {
                TimerState timerState = timer.state;
                timer.resume();
                assertThat(timerState, is(TimerState.NOT_STARTED));
            }

            @Test
            @DisplayName("Timer can be resumed if it's paused")
            void shouldBeAbleToResumeIfPaused() {
                timer.start();
                timer.pause();
                TimerState timerStateBefore = timer.state;

                timer.resume();
                TimerState timerStateAfter = timer.state;

                assertThat(timerStateBefore, is(TimerState.PAUSED));
                assertThat(timerStateAfter, is(TimerState.RUNNING));
            }
        }

        @DisplayName("Duration")
        @Nested
        class DurationLogic {

            @BeforeEach
            void init() {
                timer = new Timer(FIXED_CLOCK);
            }

            @Test
            @DisplayName("Duration for a timer not started is zero")
            void durationShouldBeZero() {
                Duration activeDuration = timer.getActiveDuration();
                Duration totalDuration = timer.getTotalDuration();

                assertThat(activeDuration, is(Duration.ZERO));
                assertThat(totalDuration, is(Duration.ZERO));
            }

            @Nested
            @DisplayName("Active time")
            class ActiveTime {

                @Test
                @DisplayName("Active duration for a timer running for 5 seconds with no pauses is 5 seconds")
                void durationShouldBeFive() {

                    // Arrange
                    timer.startTime = FAKE_INSTANT_NOW.minus(Duration.ofSeconds(5));

                    Duration activeDuration = timer.getActiveDuration();

                    assertThat(activeDuration, is(Duration.ofSeconds(5)));
                }

                @Test
                @DisplayName("Active duration for a timer running for 5 seconds with a 1 second pause is 4 seconds")
                void activeDurationForATimerWithOnePauseShouldBeFour() {

                    // Arrange
                    timer.startTime = FAKE_INSTANT_NOW.minus(Duration.ofSeconds(5));
                    timer.pauses.add(Duration.ofSeconds(1));

                    // Act
                    Duration activeDuration = timer.getActiveDuration();

                    // Assert
                    assertThat(activeDuration, is(Duration.ofSeconds(4)));
                }
            }

            @Nested
            @DisplayName("Total time")
            class TotalTime {

                @DisplayName("Total duration for a timer running for 5 seconds with no pauses is 5 seconds")
                @Test
                void totalDurationShouldBeFive() {

                    // Arrange
                    timer.startTime = FAKE_INSTANT_NOW.minus(Duration.ofSeconds(5));

                    // Act
                    Duration totalDuration = timer.getTotalDuration();

                    // Assert
                    assertThat(totalDuration, is(Duration.ofSeconds(5)));
                }

                @DisplayName(
                        "Total duration for a timer running for 5 seconds with a 1 second pause is still 5 seconds")
                @Test
                void totalDurationForATimerWithOnePauseShouldBeFour() {

                    // Arrange
                    timer.startTime = FAKE_INSTANT_NOW.minus(Duration.ofSeconds(5));
                    timer.pauses.add(Duration.ofSeconds(1));

                    // Act
                    Duration totalDuration = timer.getTotalDuration();

                    // Assert
                    assertThat(totalDuration, is(Duration.ofSeconds(5)));
                }
            }

            @Test
            @DisplayName(
                    "Active duration for a timer running for 5 seconds with two pauses of 1 second each is 3 seconds")
            void activeDurationForATimerWithTwoPausesShouldBeThree() {

                // Arrange
                timer.startTime = FAKE_INSTANT_NOW.minus(Duration.ofSeconds(5));

                timer.pauses.add(Duration.ofSeconds(1));
                timer.pauses.add(Duration.ofSeconds(1));

                // Act
                Duration activeDuration = timer.getActiveDuration();

                // Assert
                assertThat(activeDuration, is(Duration.ofSeconds(3)));
            }
        }

        @DisplayName("From snapshot")
        @Nested
        class FromSnapshot {

            @BeforeEach
            void init() {
                timer = new Timer();
            }

            @Test
            @DisplayName("Timer recreated from snapshot correctly")
            void fromSnapshot() {

                // Arrange
                TimerSnapshot snapshot = TimerSnapshot.of(timer);
                Timer timerFromSnapshot = new Timer(snapshot);

                // Assert
                assertThat(timerFromSnapshot.pauseStartTime, is(nullValue()));
                assertThat(timerFromSnapshot.startTime, is(nullValue()));
                assertThat(timerFromSnapshot.getState(), is(TimerState.NOT_STARTED));
                assertThat(timerFromSnapshot.getActiveDuration(), is(Duration.ZERO));
                assertThat(timerFromSnapshot.getTotalDuration(), is(Duration.ZERO));
            }
        }
    }
}
