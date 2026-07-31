// src/app/services/overlay/overlay-handle.ts
import { InjectionToken } from '@angular/core';
import { OverlayRef } from '@angular/cdk/overlay';

/** Data passed *into* an overlay component. Inject with `inject(OVERLAY_DATA)`. */
export const OVERLAY_DATA = new InjectionToken<unknown>('OVERLAY_DATA');

/**
 * Handle given to both the opener (via OverlayService.open) and the overlay
 * component (via DI). There are two exit points:
 *
 * - `close(result?)` — the overlay ran its course. Resolves `closed`, so result
 *   handlers run.
 * - `dismiss(ignoreAnimation?)` — the opener is tearing the overlay down (navigating away,
 *   the game ended). `closed` never resolves, so result handlers never run.
 *
 * Both dispose the overlay after its exit animation; whichever comes first wins.
 */
export class OverlayHandle<R = unknown> {

  /**
   * Resolves once the overlay is fully gone, with the result (or undefined).
   * Never resolves if the overlay was dismissed — a dismissal is not a result.
   */
  readonly closed: Promise<R | undefined>;

  private resolveClosed!: (result: R | undefined) => void;
  private isClosed = false;
  private leave?: () => Promise<void>;

  constructor(private readonly overlayRef: OverlayRef) {
    this.closed = new Promise<R | undefined>((resolve) => {
      this.resolveClosed = resolve;
    });
  }

  /**
   * Register an exit animation, run by `close()` before the overlay is disposed.
   * The overlay component calls this; the returned promise should resolve once
   * the animation has finished.
   */
  registerLeave(leave: () => Promise<void>): void {
    this.leave = leave;
  }

  async close(result?: R): Promise<void> {
    return this.teardown(() => this.resolveClosed(result));
  }

  /**
   * Removes the overlay without reporting a result. Use when the overlay is being taken
   * away from the user rather than answered by them — otherwise the `closed` handlers
   * would read the teardown as a decision and act on it.
   *
   * @param ignoreAnimation skips the registered leave animation, so the overlay is gone by
   * the time this returns. For teardowns the user shouldn't see play out — the page behind
   * the overlay is already going away, or the overlay is being replaced immediately.
   */
  async dismiss(ignoreAnimation = false): Promise<void> {
    return this.teardown(undefined, ignoreAnimation);
  }

  private async teardown(report?: () => void, ignoreAnimation = false): Promise<void> {
    if (this.isClosed) {
      return; // guard: backdrop + button could both fire
    }
    this.isClosed = true;

    try {
      if (!ignoreAnimation) {
        await this.leave?.();
      }
    } finally {
      report?.();
      this.overlayRef.dispose();
    }
  }
}
