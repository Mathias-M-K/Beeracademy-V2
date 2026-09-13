// src/app/services/overlay/overlay-handle.ts
import {InjectionToken} from '@angular/core';
import {OverlayRef} from '@angular/cdk/overlay';


export const OVERLAY_DATA = new InjectionToken<unknown>('OVERLAY_DATA');

export class OverlayHandle<R = unknown> {


  readonly closed: Promise<R | undefined>;

  private resolveClosed!: (result: R | undefined) => void;
  private isClosed = false;


  constructor(private readonly overlayRef: OverlayRef) {
    this.closed = new Promise<R | undefined>((resolve) => {
      this.resolveClosed = resolve;
    });
  }

  private async startExitAnimation(): Promise<void> {

    const element = this.overlayRef.overlayElement.firstElementChild;
    const backdropElement = this.overlayRef.backdropElement;
    if (!element) return;

    if(backdropElement){
      this.overlayRef.backdropElement?.classList.add('backdrop-exiting');
    }

    element.classList.add('overlay-leaving');
    await Promise.all(element.getAnimations().map(a => a.finished.catch(() => {})));
  }

  public async close(result?: R): Promise<void> {

    return this.teardown(() => this.resolveClosed(result));
  }

  public async dismiss(ignoreAnimation = false): Promise<void> {
    return this.teardown(() => this.resolveClosed(undefined), ignoreAnimation);
  }

  private async teardown(report?: () => void, ignoreAnimation = false): Promise<void> {
    if (this.isClosed) {
      return; // guard: backdrop + button could both fire
    }
    this.isClosed = true;

    try {
      if (!ignoreAnimation) {
        await this.startExitAnimation();
      }

    } finally {
      report?.();
      this.overlayRef.dispose();
    }
  }
}
