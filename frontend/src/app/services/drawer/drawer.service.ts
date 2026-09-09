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
import {PartyShareDrawerComponent} from '../../drawer/party-share-drawer/party-share-drawer.component';

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

  public showConfirmationDrawer(participantId: string){
    this.showDrawer(ConfirmationDrawer, participantId);
  }

  public showPartyShareDrawer(partyId: string){
    this.showDrawer(PartyShareDrawerComponent, partyId);
  }

  private showDrawer(component: ComponentType<any>, data?: any): void {

    const pos = this.isCompact() ?
      this.posBuilder.global().centerHorizontally().bottom() :
      this.posBuilder.global().centerHorizontally().centerVertically();


    this.overlayService.openOverlay({
      data: data,
      component: component,
      position: pos,
      backdrop:true,
      componentClasses: this.isCompact()
        ? ['drawer-pane', 'drawer-pane--compact']
        : ['drawer-pane'],
      backdropClass: 'drawer-backdrop',
      dismissOnBackdropClick: true
    })
  }

}
