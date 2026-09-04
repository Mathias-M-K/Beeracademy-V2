import {Component, inject} from '@angular/core';
import {BreakpointObserver, Breakpoints} from '@angular/cdk/layout';
import {toSignal} from '@angular/core/rxjs-interop';
import {map} from 'rxjs';
import {Player} from '../../services/game/models/player';
import {OVERLAY_DATA, OverlayHandle} from '../../services/overlay/models/overlay-handle';
import {PlayerOverviewEntity} from './player-overview-entity/player-overview-entity.component';
import {MaterialIcon} from '../../common/components/material-icon/material-icon';
import {GameService} from '../../services/game/game.service';

export interface PlayerOverviewDrawerData {
  players: Player[];
}

@Component({
  imports: [
    PlayerOverviewEntity,
    MaterialIcon
  ],
  selector: 'app-player-overview-player-overview-drawer',
  styleUrl: './player-overview-drawer.component.scss',
  templateUrl: './player-overview-drawer.component.html',
  host: {
    '[class.isCompact]': 'isCompact()',
  }
})
export class PlayerOverviewDrawerComponent {

  protected readonly overviewData = inject(OVERLAY_DATA) as PlayerOverviewDrawerData;
  protected readonly overlayHandle = inject(OverlayHandle);
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly gameService = inject(GameService);

  protected onDisconnectOrRelease(player: Player) {
    this.gameService.dispatchReleaseAction(player.id);
  }

  protected isCompact = toSignal(
    this.breakpointObserver.observe([Breakpoints.Handset])
      .pipe(
        map(data => data.matches),
      ), {initialValue: false}
  )

  protected closeOverview() {
    this.overlayHandle.close();
  }
}
