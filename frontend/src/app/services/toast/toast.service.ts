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

  private readonly _toasts = signal<ToastData[]>([]);
  public readonly toasts = this._toasts.asReadonly();

  private overlayHandle: OverlayHandle<void> | null = null;

  /**
   * Set while the container plays its exit. The handle is only usable again once that
   * resolves, so a toast arriving mid-close waits rather than opening a second container.
   */
  private isClosing = false;

  protected isCompact = toSignal(
    this.breakpointObserver.observe([Breakpoints.Handset]).pipe(map((data) => data.matches)),
    { initialValue: false },
  );

  public showToast(title: string, text: string, icon: string, state?: ToastState): void {
    this._toasts.update((existingToasts) => [
      ...existingToasts,
      new ToastData(title, text, icon, state),
    ]);

    this.syncOverlay();
  }

  public removeToast(toastId: string): void {
    this._toasts.update((toasts) => toasts.filter((toast) => toast.id !== toastId));

    this.syncOverlay();
  }

  /** Keeps the container's existence in step with the list, whichever way the list moved. */
  private syncOverlay(): void {
    if (this.isClosing) {
      return;
    }

    const wantsContainer = this._toasts().length > 0;

    if (wantsContainer && !this.overlayHandle) {
      this.openToastOverlay();
      return;
    }

    if (!wantsContainer && this.overlayHandle) {
      this.closeToastOverlay();
    }
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
    if (!handle) {
      return;
    }

    this.isClosing = true;

    void handle.close();
    void handle.closed.then(() => {
      this.isClosing = false;
      this.overlayHandle = null;

      // A toast may have arrived while the exit was playing.
      this.syncOverlay();
    });
  }
}
