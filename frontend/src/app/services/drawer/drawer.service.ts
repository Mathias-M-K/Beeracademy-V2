import {inject, Service} from '@angular/core';
import {OverlayService} from '../overlay/overlay.service';
import {
  PlayerOverviewDrawerComponent,
  PlayerOverviewDrawerData
} from '../../drawer/player-overview-drawer/player-overview-drawer.component';
import {ComponentType, OverlayPositionBuilder} from '@angular/cdk/overlay';
import {BreakpointObserver, Breakpoints} from '@angular/cdk/layout';
import {toSignal} from '@angular/core/rxjs-interop';
import {map} from 'rxjs';
import {Player} from '../game/models/player';

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

  public showPlayerOverviewDrawer(players: Player[]): void {

    const playerOverviewData: PlayerOverviewDrawerData = {players: players};
    this.showDrawer(playerOverviewData, PlayerOverviewDrawerComponent);

  }

  private showDrawer(data: any, component: ComponentType<any>): void {

    const pos = this.isCompact() ?
      this.posBuilder.global().centerHorizontally().bottom() :
      this.posBuilder.global().right();


    this.overlayService.openOverlay({
      component: component,
      data: data,
      position: pos,
      backdrop:true,
      backdropClass: 'drawer-backdrop'
    })
  }

}
