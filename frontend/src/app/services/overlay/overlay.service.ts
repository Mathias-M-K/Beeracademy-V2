import {inject, Injectable, Injector} from '@angular/core';
import {ComponentType, Overlay, OverlayRef} from '@angular/cdk/overlay';
import {ComponentPortal} from '@angular/cdk/portal';
import {OVERLAY_DATA, OverlayHandle} from './models/overlay-handle';

@Injectable({
  providedIn: 'root',
})
export class OverlayService {

  private readonly overlay = inject(Overlay);
  private readonly injector = inject(Injector);

  public openOverlay<C, D, R>(component: ComponentType<C>, data?: D): OverlayHandle<R> {

    const overlayRef: OverlayRef = this.overlay.create({
      hasBackdrop: true,
      positionStrategy: this.overlay.position()
        .global()
        .centerHorizontally()
        .centerVertically(),
      scrollStrategy: this.overlay.scrollStrategies.block()
    });

    const handle = new OverlayHandle<R>(overlayRef)

    const injector = Injector.create({
      parent: this.injector,
      providers: [
        {provide: OVERLAY_DATA, useValue: data},
        {provide: OverlayHandle, useValue: handle},
      ]
    });

    overlayRef.backdropClick().subscribe(() => handle.close());

    overlayRef.attach(new ComponentPortal(component, null, injector));

    return handle;
  }
}
