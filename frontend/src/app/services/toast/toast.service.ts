import {ApplicationRef, inject, Injectable, signal} from '@angular/core';
import {OverlayConf, OverlayService} from '../overlay/overlay.service';
import {OverlayPositionBuilder} from '@angular/cdk/overlay';
import {ToastData, ToastState} from '../../overlay/toast/models/toast-data';
import {ToastContainer} from '../../overlay/toast/toast-container/toast-container';
import {OverlayHandle} from '../overlay/models/overlay-handle';

@Injectable({
  providedIn: 'root',
})
export class ToastService {

  private readonly overlayService = inject(OverlayService);
  private readonly posBuilder = inject(OverlayPositionBuilder);
  private readonly appRef = inject(ApplicationRef);

  private readonly _toasts = signal<ToastData[]>([])
  public readonly toasts = this._toasts.asReadonly();

  private readonly overlayActive = signal<boolean>(false);
  private overlayHandle!: OverlayHandle<void>;

  public showToast(title: string, text: string, icon: string, state?: ToastState): void {

    this._toasts.update(existingToasts => [new ToastData(title, text, icon, state), ...existingToasts]);

    if (this.overlayActive()) {
      return;
    }

    this.openToastOverlay();
  }

  public removeToast(toastId: string): void {

    const remove = () => {
      this._toasts.update((toasts) => {
        return toasts.filter((toast) => toast.id !== toastId);
      })

      if (this.overlayActive() && this._toasts().length === 0) {
        this.overlayActive.set(false);
        this.overlayHandle.close();
      }
    };


    if (!document.startViewTransition) {
      return remove();
    }else{
      document.startViewTransition(()=>{
        remove();
        this.appRef.tick();
      })
    }
  }

  private openToastOverlay() {
    this.overlayActive.set(true);
    const position = this.posBuilder.global().centerHorizontally().bottom();

    const overlayConf: OverlayConf<void> = {
      backdrop: false, component: ToastContainer, position: position
    }
    this.overlayHandle = this.overlayService.openOverlay<void>(overlayConf)
    this.overlayHandle.closed.then(() => this.overlayActive.set(false));
  }
}
