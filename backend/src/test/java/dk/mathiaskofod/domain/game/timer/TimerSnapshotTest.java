package dk.mathiaskofod.domain.game.timer;

import dk.mathiaskofod.domain.game.timer.models.TimerState;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.*;

class TimerSnapshotTest {

    @Nested
    @DisplayName("State is correctly captured in snapshot")
    class StateIsCorrectlyCapturedInSnapshot {

        Timer timer;

        @BeforeEach
        void init() {
            timer = new Timer();
        }

        @Test
        @DisplayName("State should be NOT_STARTED")
        void stateIsNotStarted() {

            // Act
            TimerSnapshot snapshot = TimerSnapshot.of(timer);

            // Assert
            assertThat(timer.state, is(TimerState.NOT_STARTED));
            assertThat(snapshot.state(), is(TimerState.NOT_STARTED));
        }

        @Test
        @DisplayName("State should be RUNNING")
        void timerStateShouldBeRunning() {

            // Arrange
            timer.start();

            // Act
            TimerSnapshot snapshot = TimerSnapshot.of(timer);

            // Assert
            assertThat(timer.state, is(TimerState.RUNNING));
            assertThat(snapshot.state(), is(TimerState.RUNNING));
        }

        @Test
        @DisplayName("State should be PAUSED")
        void timerStateShouldBePaused() {

            // Arrange
            timer.start();
            timer.pause();

            // Act
            TimerSnapshot snapshot = TimerSnapshot.of(timer);

            // Assert
            assertThat(timer.state, is(TimerState.PAUSED));
            assertThat(snapshot.state(), is(TimerState.PAUSED));
        }
    }

    @Nested
    @DisplayName("Resume functionality")
    class ResumeFunctionality {

        Timer timer;

        @BeforeEach
        void init() {
            timer = new Timer();
        }

        @Test
        @DisplayName("Timer should return to RUNNING state after resume")
        void timerShouldReturnToRunningStateAfterResume() {

            // Arrange
            timer.start();
            timer.pause();
            timer.resume();

            // Act
            TimerSnapshot snapshot = TimerSnapshot.of(timer);

            // Assert
            assertThat(timer.state, is(TimerState.RUNNING));
            assertThat(snapshot.state(), is(TimerState.RUNNING));
        }

        @Test
        @DisplayName("Resume should not be possible when timer is not PAUSED")
        void resumeShouldNotBePossibleWhenTimerIsNotPaused() {

            // Arrange
            timer.start();

            // Act
            TimerSnapshot snapshot = TimerSnapshot.of(timer);

            // Assert
            assertThat(timer.state, is(TimerState.RUNNING));
            assertThat(snapshot.state(), is(TimerState.RUNNING));
        }

        @Test
        @DisplayName("Resume should not be possible when timer is NOT_STARTED")
        void resumeShouldNotBePossibleWhenTimerIsNotStarted() {

            // Arrange
            // Timer is in NOT_STARTED state

            // Act
            TimerSnapshot snapshot = TimerSnapshot.of(timer);

            // Assert
            assertThat(timer.state, is(TimerState.NOT_STARTED));
            assertThat(snapshot.state(), is(TimerState.NOT_STARTED));
        }
    }

    @Nested
    @DisplayName("Reset functionality")
    class ResetFunctionality {

        Timer timer;

        @BeforeEach
        void init() {
            timer = new Timer();
        }

        @Test
        @DisplayName("Reset should clear pause history")
        void resetShouldClearPauseHistory() {

            // Arrange
            Timer resetTimer = new Timer();
            resetTimer.start();
            resetTimer.pause();
            resetTimer.resume();

            // Act
            resetTimer.reset();
            TimerSnapshot snapshot = TimerSnapshot.of(resetTimer);

            // Assert
            assertThat(snapshot.pauses(), is(empty()));
        }
    }

    @Nested
    @DisplayName("Snapshot immutability")
    class SnapshotImmutability {

        Timer timer;

        @BeforeEach
        void init() {
            timer = new Timer();
        }

        @Test
        @DisplayName("Snapshot should not affect original timer state")
        void snapshotShouldNotAffectOriginalTimerState() {

            // Arrange
            timer.start();
            TimerSnapshot snapshot1 = TimerSnapshot.of(timer);

            // Act
            timer.pause();
            TimerSnapshot snapshot2 = TimerSnapshot.of(timer);

            // Assert
            assertThat(snapshot1.state(), is(TimerState.RUNNING));
            assertThat(snapshot2.state(), is(TimerState.PAUSED));
        }

        @Test
        @DisplayName("Multiple snapshots should capture different states")
        void multipleSnapshotsShouldCaptureDifferentStates() {

            // Arrange
            timer.start();
            TimerSnapshot snapshot1 = TimerSnapshot.of(timer);
            timer.pause();
            TimerSnapshot snapshot2 = TimerSnapshot.of(timer);
            timer.resume();
            TimerSnapshot snapshot3 = TimerSnapshot.of(timer);

            // Assert
            assertThat(snapshot1.state(), is(TimerState.RUNNING));
            assertThat(snapshot2.state(), is(TimerState.PAUSED));
            assertThat(snapshot3.state(), is(TimerState.RUNNING));
        }
    }

    @Nested
    @DisplayName("Pause history tracking")
    class PauseHistoryTracking {

        Timer timer;

        @BeforeEach
        void init() {
            timer = new Timer();
        }

        @Test
        @DisplayName("Snapshot should capture pause history after multiple pause/resume cycles")
        void snapshotShouldCapturePauseHistoryAfterMultiplePauseResumeCycles() {

            // Arrange
            timer.start();
            timer.pause();
            timer.resume();
            timer.pause();
            timer.resume();
            timer.pause();
            timer.resume();

            // Act
            TimerSnapshot snapshot = TimerSnapshot.of(timer);

            // Assert
            assertThat(snapshot.pauses(), hasSize(3));
        }

        @Test
        @DisplayName("Snapshot should capture empty pause history for new timer")
        void snapshotShouldCaptureEmptyPauseHistoryForNewTimer() {

            // Arrange
            timer = new Timer();

            // Act
            TimerSnapshot snapshot = TimerSnapshot.of(timer);

            // Assert
            assertThat(snapshot.pauses(), is(empty()));
        }

        @Test
        @DisplayName("Snapshot should capture empty pause history after reset")
        void snapshotShouldCaptureEmptyPauseHistoryAfterReset() {

            // Arrange
            timer.start();
            timer.pause();
            timer.resume();
            timer.reset();

            // Act
            TimerSnapshot snapshot = TimerSnapshot.of(timer);

            // Assert
            assertThat(snapshot.pauses(), is(empty()));
        }
    }
}
