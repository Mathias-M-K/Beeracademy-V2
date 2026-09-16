import { OverlayRef } from '@angular/cdk/overlay';
import { OverlayHandle } from '../app/services/overlay/models/overlay-handle';

/**
 * A real {@link OverlayHandle} over a minimal fake {@link OverlayRef}, so close/dismiss keep their
 * production semantics (including resolving `closed`) without a CDK overlay container.
 */
export function createOverlayHandle<R = unknown>(): OverlayHandle<R> {
  const overlayElement = document.createElement('div');
  overlayElement.appendChild(document.createElement('div'));

  const overlayRef = {
    overlayElement,
    backdropElement: null,
    dispose: vi.fn(),
  } as unknown as OverlayRef;

  return new OverlayHandle<R>(overlayRef);
}
