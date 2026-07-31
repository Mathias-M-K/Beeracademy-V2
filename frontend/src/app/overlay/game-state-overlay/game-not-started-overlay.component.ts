import {Component, ElementRef, inject, signal} from '@angular/core';
import {OVERLAY_DATA, OverlayHandle} from '../../services/overlay/models/overlay-handle';
import {MaterialIcon} from '../../common/components/material-icon/material-icon';
import {Role} from '../../../api-models/model/role';

@Component({
  selector: 'app-game-state-overlay',
  imports: [
    MaterialIcon
  ],
  templateUrl: './game-not-started-overlay.component.html',
  styleUrl: './game-not-started-overlay.component.scss',
  host: {
    '[class.leaving]': 'leaving()',
  },
})
export class GameNotStartedOverlay {

  protected readonly handle = inject(OverlayHandle);
  protected readonly isGameClient = inject(OVERLAY_DATA) as boolean;

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly leaving = signal<boolean>(false);

  constructor() {
    this.handle.registerLeave(async () => {
      await this.animateOut();
    })
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
      const fallback = setTimeout(done, 5000);

      this.leaving.set(true);
    });
  }

  protected readonly Role = Role;
}
