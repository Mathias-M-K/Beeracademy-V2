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

  /** Resolves once, with the result (or undefined if cancelled). */
  readonly closed: Promise<R | undefined>;

  private resolveClosed!: (result: R | undefined) => void;
  private isClosed = false;

  constructor(private readonly overlayRef: OverlayRef) {
    this.closed = new Promise<R | undefined>((resolve) => {
      this.resolveClosed = resolve;
    });
  }

  close(result?: R): void {
    if (this.isClosed) {
      return; // guard: backdrop + button could both fire
    }
    this.isClosed = true;
    this.resolveClosed(result);
    this.overlayRef.dispose();
  }
}
