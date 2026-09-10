import {computed, effect, signal, Signal, untracked} from '@angular/core';

/** Matches the .5s width transition on the beer dots, so number and dots move together. */
const DEFAULT_DURATION_MS = 500;

export interface TweenOptions {
  /** How long the ease towards each new value takes. */
  durationMs?: number;
  /** Decimal places to round the output to. Omit to keep the raw eased value. */
  decimals?: number;
}

const easeOut = (progress: number): number => 1 - Math.pow(1 - progress, 3);

const roundTo = (value: number, decimals: number): number => {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
};

/**
 * Mirrors a number signal, but eases towards each new value instead of snapping to it.
 * Starts at 0, so a freshly rendered card counts up the same way its dots fill up.
 *
 * Must be called from an injection context, e.g. a field initializer.
 */
export function tweenedNumber(source: Signal<number>, options: TweenOptions = {}): Signal<number> {
  const {durationMs = DEFAULT_DURATION_MS, decimals} = options;
  const displayed = signal(0);

  effect((onCleanup) => {
    const target = source();
    const from = untracked(displayed);

    if (from === target) return;

    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      displayed.set(target);
      return;
    }

    const start = performance.now();
    let frame = 0;

    const step = (now: number) => {
      const progress = Math.min((now - start) / durationMs, 1);
      displayed.set(from + (target - from) * easeOut(progress));

      if (progress < 1) frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);
    onCleanup(() => cancelAnimationFrame(frame));
  });

  return decimals === undefined
    ? displayed.asReadonly()
    : computed(() => roundTo(displayed(), decimals));
}
