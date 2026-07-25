import {inject, Injectable, Injector} from '@angular/core';
import {ComponentType, GlobalPositionStrategy, Overlay, OverlayPositionBuilder, OverlayRef} from '@angular/cdk/overlay';
import {ComponentPortal} from '@angular/cdk/portal';
import {OVERLAY_DATA, OverlayHandle} from './models/overlay-handle';

export interface OverlayConf<D> {
  component: ComponentType<any>;
  data?: D;
  backdrop?: boolean;
  position?: GlobalPositionStrategy;
}

@Injectable({
  providedIn: 'root',
})
export class OverlayService {

  //TODO create a shared modal component, that other components can wire themselves into, to get a shared design across overlays
  private readonly overlay = inject(Overlay);
  private readonly injector = inject(Injector);
  private readonly positionBuilder = inject(OverlayPositionBuilder);

  public openOverlay<ReturnModel, D=unknown>(conf: OverlayConf<D>): OverlayHandle<ReturnModel> {

    const position = conf.position ?? this.positionBuilder.global().centerVertically().centerHorizontally();

    const hasBackdrop = conf.backdrop ?? true;
    const overlayRef: OverlayRef = this.overlay.create({
      hasBackdrop: hasBackdrop,
      backdropClass: hasBackdrop ? 'overlay-backdrop' : '',
      positionStrategy: position,
      scrollStrategy: hasBackdrop ? this.overlay.scrollStrategies.block() : this.overlay.scrollStrategies.noop()
    });

    const handle = new OverlayHandle<ReturnModel>(overlayRef)

    const injector = Injector.create({
      parent: this.injector,
      providers: [
        {provide: OVERLAY_DATA, useValue: conf.data},
        {provide: OverlayHandle, useValue: handle},
      ]
    });

    overlayRef.attach(new ComponentPortal(conf.component, null, injector));

    return handle;
  }
}
