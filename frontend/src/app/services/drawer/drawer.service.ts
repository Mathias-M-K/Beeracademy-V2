import {inject, Service} from '@angular/core';
import {OverlayConf, OverlayService} from '../overlay/overlay.service';
import {
  PlayerOverviewDrawerComponent
} from '../../drawer/player-overview-drawer/player-overview-drawer.component';
import {OverlayPositionBuilder} from '@angular/cdk/overlay';
import {BreakpointObserver, Breakpoints} from '@angular/cdk/layout';
import {toSignal} from '@angular/core/rxjs-interop';
import {map} from 'rxjs';
import {ConfirmationDrawer} from '../../drawer/confirmation-drawer/confirmation-drawer';
import {PartyShareDrawerComponent} from '../../drawer/party-share-drawer/party-share-drawer.component';
import {GamePausedData} from '../../drawer/game-paused-drawer/models/game-paused-data';
import {GamePausedDrawerComponent} from '../../drawer/game-paused-drawer/game-paused-drawer.component';
import {OverlayHandle} from '../overlay/models/overlay-handle';
import {QrScannerDrawer} from '../../drawer/qr-scanner-drawer/qr-scanner-drawer';

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
    const overlayConf: Partial<OverlayConf<void>> = {
      component: PlayerOverviewDrawerComponent
    }
    this.showDrawer(overlayConf);
  }

  public showConfirmationDrawer(participantId: string) {
    const overlayConf: Partial<OverlayConf<string>> = {
      component: ConfirmationDrawer,
      data: participantId
    }
    this.showDrawer(overlayConf);
  }

  public showPartyShareDrawer(partyId: string) {
    const overlayConf: Partial<OverlayConf<string>> = {
      component: PartyShareDrawerComponent,
      data: partyId
    }
    this.showDrawer(overlayConf);
  }

  public showGamePausedDrawer(gamePauseData: GamePausedData): OverlayHandle<void> {
    const overlayConf: OverlayConf<GamePausedData> = {
      component: GamePausedDrawerComponent,
      data: gamePauseData,
      dismissOnBackdropClick: false
    }
    return this.showDrawer<void>(overlayConf);
  }

  public showQrScanner(): OverlayHandle<string> {
    const overlayConf: Partial<OverlayConf<string>> = {
      dismissOnBackdropClick: false,
      component: QrScannerDrawer
    }
    return this.showDrawer(overlayConf);
  }

  private showDrawer<expectedReturnObj>(overlayConf: Partial<OverlayConf<any>>): OverlayHandle<expectedReturnObj> {

    const pos = this.isCompact() ?
      this.posBuilder.global().centerHorizontally().bottom() :
      this.posBuilder.global().centerHorizontally().centerVertically();


    const defaultConf: OverlayConf<void> = {
      component: GamePausedDrawerComponent,
      position: pos,
      backdrop: true,
      componentClasses: this.isCompact()
        ? ['drawer-pane', 'drawer-pane--compact']
        : ['drawer-pane'],
      backdropClass: 'drawer-backdrop',
      dismissOnBackdropClick: true
    }

    const finalConf = {...defaultConf, ...overlayConf};

    return this.overlayService.openOverlay<expectedReturnObj>(finalConf)
  }

}
