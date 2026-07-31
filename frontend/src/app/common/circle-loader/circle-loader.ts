import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'circle-loader',
  imports: [],
  templateUrl: './circle-loader.html',
  styleUrl: './circle-loader.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[style.--cl-track-color]': 'trackColor()',
    '[style.--cl-progress-color]': 'progressColor()',
    '[class.animated]': 'animated()',
  },
})
export class CircleLoader {
  /**
   * Fraction of the ring that is filled, 0–1. Values outside the range are clamped.
   * Ignored while `value` is set.
   */
  readonly progress = input(0);

  /**
   * A running count — elapsed time, items processed, sips taken. When set, the ring
   * fills once per `rotation` of it and starts over rather than sitting full, and drives
   * itself instead of reading `progress`.
   */
  readonly value = input<number | null>(null);

  /** How much `value` makes one full lap of the ring. Only used alongside `value`. */
  readonly rotation = input(100);

  /** Ring thickness, in the same 0–100 units as the viewBox, so it scales with `size`. */
  readonly thickness = input(6);

  readonly trackColor = input('rgba(255, 255, 255, 0.25)');
  readonly progressColor = input('#fff');

  /**
   * Eases between values. Turn off when the source already updates continuously (a running
   * timer) or laps back to zero — easing would animate the wrap in reverse.
   */
  readonly animated = input(true);

  /**
   * Accessible name. When empty the ring is treated as decorative and hidden from
   * assistive tech — use that when the value is already announced by projected content.
   */
  readonly label = input('');

  /** Radius that puts the outer edge of the stroke exactly on the viewBox edge. */
  protected readonly radius = computed(() => (100 - this.thickness()) / 2);

  /**
   * How much of the ring is drawn, 0–1. A non-positive `rotation` would divide by zero
   * or run backwards, so it falls back to an empty ring.
   */
  protected readonly fraction = computed(() => {
    const value = this.value();

    if (value === null) {
      return Math.min(1, Math.max(0, this.progress()));
    }

    const rotation = this.rotation();

    if (rotation <= 0) {
      return 0;
    }

    return (Math.max(0, value) % rotation) / rotation;
  });

  /**
   * `pathLength="100"` re-declares the circumference as 100 regardless of the real
   * geometry, so the offset is simply the percentage that is *not* filled.
   */
  protected readonly dashOffset = computed(() => 100 - this.fraction() * 100);

  /**
   * A round cap on a zero-length dash renders as a stray dot in some engines, so at
   * exactly zero progress we fall back to a butt cap.
   */
  protected readonly lineCap = computed(() => (this.fraction() === 0 ? 'butt' : 'round'));

  protected readonly valueNow = computed(() => Math.round(this.fraction() * 100));
}
