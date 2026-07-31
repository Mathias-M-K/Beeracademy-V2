import { Component, computed, ElementRef, inject, OnDestroy, signal } from '@angular/core';
import { MaterialIcon } from '../../common/components/material-icon/material-icon';
import {OVERLAY_DATA, OverlayHandle} from '../../services/overlay/models/overlay-handle';
import {DotLoader} from '../../common/components/dot-loader/dot-loader';

@Component({
  selector: 'app-beer-loader-overlay',
  imports: [MaterialIcon, DotLoader],
  templateUrl: './beer-loader-overlay.html',
  styleUrl: './beer-loader-overlay.scss',
  host: {
    '[class.leaving]': 'leaving()',
  },
})
export class BeerLoaderOverlay implements OnDestroy {
  private readonly loaderMessages = inject(OVERLAY_DATA) as string[];
  private readonly handle = inject(OverlayHandle);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  private readonly messages = this.loaderMessages ?? ['Henter lobby…', 'Tapper øl…', 'Pakker kortene…'];
  private readonly index = signal(0);

  protected readonly statusText = computed(() => this.messages[this.index()]);

  // Toggles the `.leaving` class that drives the exit animation.
  protected readonly leaving = signal(false);

  // Keep the loader up for at least this long so a fast request doesn't make
  // it flash. Measured from when the overlay was created.
  private static readonly MIN_VISIBLE_MS = 500;
  private readonly openedAt = Date.now();
  private minVisibleTimer?: ReturnType<typeof setTimeout>;

  // Rotate the status text. Writing the signal schedules change detection
  // (the app is zoneless), so no manual tick is needed here.
  private readonly rotation = setInterval(() => {
    this.index.update((i) => (i + 1) % this.messages.length);
  }, 2000);

  constructor() {
    // On close: hold until the minimum visible time has elapsed, then play the
    // exit animation before the overlay is disposed.
    this.handle.registerLeave(async () => {
      await this.waitForMinVisible();
      await this.animateOut();
    });
  }

  // Resolves once the loader has been visible for at least MIN_VISIBLE_MS.
  private waitForMinVisible(): Promise<void> {
    const remaining = BeerLoaderOverlay.MIN_VISIBLE_MS - (Date.now() - this.openedAt);
    if (remaining <= 0) {
      return Promise.resolve();
    }
    return new Promise<void>((resolve) => {
      this.minVisibleTimer = setTimeout(resolve, remaining);
    });
  }

  private animateOut(): Promise<void> {
    return new Promise<void>((resolve) => {
      const el = this.host.nativeElement;

      const done = () => {
        clearTimeout(fallback);
        el.removeEventListener('animationend', onEnd);
        resolve();
      };

      // Ignore the beer/dots' own (infinite) animations bubbling up.
      const onEnd = (event: AnimationEvent) => {
        if (event.target === el) {
          done();
        }
      };

      el.addEventListener('animationend', onEnd);
      // Safety net in case animationend never fires (e.g. reduced motion).
      const fallback = setTimeout(done, 500);

      this.leaving.set(true);
    });
  }

  ngOnDestroy(): void {
    clearInterval(this.rotation);
    clearTimeout(this.minVisibleTimer);
  }
}
