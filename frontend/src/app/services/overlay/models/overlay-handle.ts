// src/app/services/overlay/overlay-handle.ts
import { InjectionToken } from '@angular/core';
import { OverlayRef } from '@angular/cdk/overlay';

/** Data passed *into* an overlay component. Inject with `inject(OVERLAY_DATA)`. */
export const OVERLAY_DATA = new InjectionToken<unknown>('OVERLAY_DATA');

/**
 * Handle given to both the opener (via OverlayService.open) and the overlay
 * component (via DI). `close(result?)` is the single exit point: it resolves
 * the `closed` promise and disposes the overlay.
 */
export class OverlayHandle<R = unknown> {

  /** Resolves once the overlay is fully gone, with the result (or undefined). */
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
    if (this.isClosed) {
      return; // guard: backdrop + button could both fire
    }
    this.isClosed = true;

    try {
      await this.leave?.();
    } finally {
      this.resolveClosed(result);
      this.overlayRef.dispose();
    }
  }
}
