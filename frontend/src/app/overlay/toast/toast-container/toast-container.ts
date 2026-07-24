import {Component, ElementRef, inject} from '@angular/core';
import {ToastService} from '../../../services/toast/toast.service';
import {OverlayHandle} from '../../../services/overlay/models/overlay-handle';
import {Toast} from '../toast/toast';

@Component({
  selector: 'app-toast-container',
  imports: [
    Toast
  ],
  templateUrl: './toast-container.html',
  styleUrl: './toast-container.scss',
})
export class ToastContainer {

  private readonly toastService = inject(ToastService);
  private readonly handle = inject(OverlayHandle);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  public readonly toasts = this.toastService.toasts;

  constructor() {
    this.handle.registerLeave(() => this.animateOut());
  }

  onToastFinished(toastId: string){
    this.toastService.removeToast(toastId);
  }

  private animateOut(): Promise<void> {
    return new Promise<void>((resolve) => {
      const el = this.host.nativeElement;

      const done = () => {
        clearTimeout(fallback);
        el.removeEventListener('animationend', onEnd);
        resolve();
      };

      // Only the departing toast's `toast-out` animation (bubbling up from the
      // child) should end the wait — ignore `toast-in` / timer-bar events.
      const onEnd = (event: AnimationEvent) => {
        if (event.animationName === 'toast-out') {
          done();
        }
      };

      el.addEventListener('animationend', onEnd);
      // Safety net if animationend never fires (e.g. reduced motion).
      const fallback = setTimeout(done, 500);
    });
  }

}
