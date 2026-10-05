import { inject, Service, signal } from '@angular/core';
import { OverlayConf, OverlayService } from '../overlay/overlay.service';
import { OverlayPositionBuilder } from '@angular/cdk/overlay';
import { ToastData, ToastState } from '../../overlay/toast/models/toast-data';
import { ToastContainer } from '../../overlay/toast/toast-container/toast-container';
import { OverlayHandle } from '../overlay/models/overlay-handle';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

@Service()
export class ToastService {
  private readonly overlayService = inject(OverlayService);
  private readonly posBuilder = inject(OverlayPositionBuilder);
  private readonly breakpointObserver = inject(BreakpointObserver);

  private readonly _toast = signal<ToastData | null>(null);
  public readonly toast = this._toast.asReadonly();

  private dismissTimer: ReturnType<typeof setTimeout> | undefined;

  private overlayHandle: OverlayHandle<void> | null = null;
  private isClosing = false;

  protected isCompact = toSignal(
    this.breakpointObserver.observe([Breakpoints.Handset]).pipe(map((data) => data.matches)),
    { initialValue: false },
  );

  public showToast(title: string, text: string, icon: string, state?: ToastState): void {
    const toast = new ToastData(title, text, icon, state);
    this._toast.set(toast);
    clearTimeout(this.dismissTimer);
    this.dismissTimer = setTimeout(() => this.dismissToast(toast.id), toast.durationMs);

    if(this.overlayHandle) return;
    this.openToastOverlay();

  }

  public dismissToast(toastId: string): void {
    if (this._toast()?.id !== toastId) return;
    clearTimeout(this.dismissTimer);
    this._toast.set(null);
    this.closeToastOverlay();
  }


  private openToastOverlay(): void {
    const position = this.posBuilder.global().centerHorizontally().bottom();

    const componentClasses = this.isCompact()
      ? ['toast-panel', 'toast-panel--compact']
      : ['toast-panel'];

    const overlayConf: OverlayConf<void> = {
      backdrop: false,
      component: ToastContainer,
      position: position,
      componentClasses: componentClasses,
    };

    this.overlayHandle = this.overlayService.openOverlay<void>(overlayConf);
  }

  private closeToastOverlay(): void {
    const handle = this.overlayHandle;
    if (!handle || this.isClosing) return;

    this.isClosing = true;
    handle.close();
    void handle.closed.then(() => {
      this.isClosing = false;
      this.overlayHandle = null;

      // A toast may have arrived while the exit was playing.
      if (this._toast()) this.openToastOverlay();
    });
  }
}
