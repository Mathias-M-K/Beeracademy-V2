import {inject, Service} from '@angular/core';
import {OverlayService} from '../overlay/overlay.service';
import {
  PlayerOverviewDrawerComponent
} from '../../drawer/player-overview-drawer/player-overview-drawer.component';
import {ComponentType, OverlayPositionBuilder} from '@angular/cdk/overlay';
import {BreakpointObserver, Breakpoints} from '@angular/cdk/layout';
import {toSignal} from '@angular/core/rxjs-interop';
import {map} from 'rxjs';
import {ConfirmationDrawer} from '../../drawer/confirmation-drawer/confirmation-drawer';

@Service()
export class DrawerService {

  private readonly overlayService = inject(OverlayService);
  private readonly posBuilder = inject(OverlayPositionBuilder);

  private readonly breakpointObserver = inject(BreakpointObserver);
  protected isCompact = toSignal(
    this.breakpointObserver.observe([Breakpoints.Handset])
      .pipe(
        map(data => data.matches),
      ), {initialValue: false}
  )

  public showPlayerOverviewDrawer(): void {
    this.showDrawer(PlayerOverviewDrawerComponent);
  }

  public showConfirmationDrawer(){
    this.showDrawer(ConfirmationDrawer)
  }

  private showDrawer(component: ComponentType<any>): void {

    const pos = this.isCompact() ?
      this.posBuilder.global().centerHorizontally().bottom() :
      this.posBuilder.global().right();


    this.overlayService.openOverlay({
      component: component,
      position: pos,
      backdrop:true,
      componentClasses: this.isCompact()
        ? ['drawer-pane', 'drawer-pane--compact']
        : ['drawer-pane'],
      backdropClass: 'drawer-backdrop'
    })
  }

}
