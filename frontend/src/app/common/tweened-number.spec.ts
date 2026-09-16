import { signal, Signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { tweenedNumber, TweenOptions } from './tweened-number';

/** Fake animation frames fire every 16ms, so the final frame lands up to one frame after the duration. */
const FRAME_MS = 16;

describe('tweenedNumber', () => {
  let source: WritableSignal<number>;

  beforeEach(() => {
    vi.useFakeTimers({
      toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'],
    });
    source = signal(0);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  function tween(options?: TweenOptions): Signal<number> {
    const tweened = TestBed.runInInjectionContext(() => tweenedNumber(source, options));
    TestBed.tick();
    return tweened;
  }

  function preferReducedMotion(): void {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query === '(prefers-reduced-motion: reduce)',
    }));
  }

  describe('initial value', () => {
    it('starts at zero', () => {
      // Arrange
      source.set(0);

      // Act
      const tweened = tween();

      // Assert
      expect(tweened()).toBe(0);
    });

    it('counts up from zero towards a non-zero starting value', () => {
      // Arrange
      source.set(100);
      const tweened = tween();

      // Act
      vi.advanceTimersByTime(500 + FRAME_MS);

      // Assert
      expect(tweened()).toBe(100);
    });
  });

  describe('easing', () => {
    it('does not move before the first animation frame', () => {
      // Arrange
      const tweened = tween();

      // Act
      source.set(100);
      TestBed.tick();

      // Assert
      expect(tweened()).toBe(0);
    });

    it('eases out, covering more than half the distance by the halfway point', () => {
      // Arrange
      const tweened = tween();
      source.set(100);
      TestBed.tick();

      // Act
      vi.advanceTimersByTime(250);

      // Assert
      expect(tweened()).toBeGreaterThan(50);
      expect(tweened()).toBeLessThan(100);
    });

    it('lands exactly on the target once the default 500ms have passed', () => {
      // Arrange
      const tweened = tween();
      source.set(100);
      TestBed.tick();

      // Act
      vi.advanceTimersByTime(500 + FRAME_MS);

      // Assert
      expect(tweened()).toBe(100);
    });

    it('honours a custom duration', () => {
      // Arrange
      const tweened = tween({ durationMs: 1_000 });
      source.set(100);
      TestBed.tick();

      // Act
      vi.advanceTimersByTime(500 + FRAME_MS);
      const halfway = tweened();
      vi.advanceTimersByTime(500);

      // Assert
      expect(halfway).toBeLessThan(100);
      expect(tweened()).toBe(100);
    });

    it('eases downwards too', () => {
      // Arrange
      source.set(100);
      const tweened = tween();
      vi.advanceTimersByTime(500 + FRAME_MS);

      // Act
      source.set(40);
      TestBed.tick();
      vi.advanceTimersByTime(250);
      const midway = tweened();
      vi.advanceTimersByTime(250 + FRAME_MS);

      // Assert
      expect(midway).toBeGreaterThan(40);
      expect(midway).toBeLessThan(100);
      expect(tweened()).toBe(40);
    });

    it('retargets from the current value when the source changes mid-tween', () => {
      // Arrange
      const tweened = tween();
      source.set(100);
      TestBed.tick();
      vi.advanceTimersByTime(250);
      const interrupted = tweened();

      // Act
      source.set(0);
      TestBed.tick();
      vi.advanceTimersByTime(16);
      const afterRetarget = tweened();
      vi.advanceTimersByTime(500 + FRAME_MS);

      // Assert
      expect(afterRetarget).toBeLessThan(interrupted);
      expect(afterRetarget).toBeGreaterThan(0);
      expect(tweened()).toBe(0);
    });
  });

  describe('rounding', () => {
    it('keeps the raw eased value when no decimals are given', () => {
      // Arrange
      const tweened = tween();
      source.set(1);
      TestBed.tick();

      // Act
      vi.advanceTimersByTime(100);

      // Assert
      expect(Number.isInteger(tweened())).toBe(false);
    });

    it('rounds to the requested number of decimals', () => {
      // Arrange
      const tweened = tween({ decimals: 1 });
      source.set(1);
      TestBed.tick();

      // Act
      vi.advanceTimersByTime(100);

      // Assert
      expect(tweened()).toBeGreaterThan(0);
      expect(tweened() * 10).toBe(Math.round(tweened() * 10));
    });

    it('rounds to whole numbers with zero decimals', () => {
      // Arrange
      const tweened = tween({ decimals: 0 });
      source.set(10);
      TestBed.tick();

      // Act
      vi.advanceTimersByTime(100);

      // Assert
      expect(Number.isInteger(tweened())).toBe(true);
    });
  });

  describe('reduced motion', () => {
    it('snaps straight to the target', () => {
      // Arrange
      preferReducedMotion();
      const tweened = tween();

      // Act
      source.set(100);
      TestBed.tick();

      // Assert
      expect(tweened()).toBe(100);
    });
  });
});
