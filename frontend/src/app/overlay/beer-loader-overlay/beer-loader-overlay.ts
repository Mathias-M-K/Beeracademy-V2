import { Component, computed, ElementRef, inject, OnDestroy, signal } from '@angular/core';
import { MaterialIcon } from '../../common/material-icon/material-icon';
import { OverlayHandle } from '../../services/overlay/models/overlay-handle';

@Component({
  selector: 'app-beer-loader-overlay',
  imports: [MaterialIcon],
  templateUrl: './beer-loader-overlay.html',
  styleUrl: './beer-loader-overlay.scss',
  host: {
    '[class.leaving]': 'leaving()',
  },
})
export class BeerLoaderOverlay implements OnDestroy {
  private readonly handle = inject(OverlayHandle);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  private readonly messages = ['Henter lobby…', 'Tapper øl…', 'Pakker kortene…'];
  private readonly index = signal(0);

  protected readonly statusText = computed(() => this.messages[this.index()]);

  // Toggles the `.leaving` class that drives the exit animation.
  protected readonly leaving = signal(false);

  // Rotate the status text. Writing the signal schedules change detection
  // (the app is zoneless), so no manual tick is needed here.
  private readonly rotation = setInterval(() => {
    this.index.update((i) => (i + 1) % this.messages.length);
  }, 2000);

  constructor() {
    // Play the exit animation when the overlay is closed, before it is disposed.
    this.handle.registerLeave(() => this.animateOut());
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
  }
}