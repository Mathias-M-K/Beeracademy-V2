import { TestBed } from '@angular/core/testing';
import { DumbTimer } from './dumb-timer';

describe('DumbTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] });
    vi.setSystemTime(new Date('2026-01-01T20:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  function createTimer(elapsedTime?: number): DumbTimer {
    const timer = TestBed.runInInjectionContext(() => new DumbTimer(elapsedTime));
    TestBed.tick();
    return timer;
  }

  function advance(ms: number): void {
    vi.advanceTimersByTime(ms);
    TestBed.tick();
  }

  describe('initial state', () => {
    it('starts stopped at zero', () => {
      // Arrange
      const timer = createTimer();

      // Act
      advance(310);

      // Assert
      expect(timer.timerRunning()).toBe(false);
      expect(timer.elapsedTime()).toBe(0);
    });

    it('starts at the given elapsed time without running', () => {
      // Arrange
      const timer = createTimer(1_500);

      // Act
      advance(310);

      // Assert
      expect(timer.timerRunning()).toBe(false);
      expect(timer.elapsedTime()).toBe(1_500);
    });
  });

  describe('startTimer', () => {
    it('counts up with the clock', () => {
      // Arrange
      const timer = createTimer();

      // Act
      timer.startTimer();
      advance(310);

      // Assert
      expect(timer.timerRunning()).toBe(true);
      expect(timer.elapsedTime()).toBe(310);
    });

    it('continues from the initial elapsed time', () => {
      // Arrange
      const timer = createTimer(1_500);

      // Act
      timer.startTimer();
      advance(620);

      // Assert
      expect(timer.elapsedTime()).toBe(2_120);
    });
  });

  describe('stopTimer', () => {
    it('freezes the elapsed time', () => {
      // Arrange
      const timer = createTimer();
      timer.startTimer();
      advance(310);

      // Act
      timer.stopTimer();
      advance(1_000);

      // Assert
      expect(timer.timerRunning()).toBe(false);
      expect(timer.elapsedTime()).toBe(310);
    });

    it('resumes from where it stopped', () => {
      // Arrange
      const timer = createTimer();
      timer.startTimer();
      advance(310);
      timer.stopTimer();
      advance(5_000);

      // Act
      timer.startTimer();
      advance(310);

      // Assert
      expect(timer.elapsedTime()).toBe(620);
    });
  });

  describe('resetTimer', () => {
    it('stops the timer and clears the elapsed time', () => {
      // Arrange
      const timer = createTimer(1_500);
      timer.startTimer();
      advance(310);

      // Act
      timer.resetTimer();
      advance(310);

      // Assert
      expect(timer.timerRunning()).toBe(false);
      expect(timer.elapsedTime()).toBe(0);
    });

    it('counts from zero when started again', () => {
      // Arrange
      const timer = createTimer(1_500);
      timer.startTimer();
      advance(310);
      timer.resetTimer();

      // Act
      timer.startTimer();
      advance(62);

      // Assert
      expect(timer.elapsedTime()).toBe(62);
    });
  });
});
