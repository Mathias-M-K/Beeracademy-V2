import {Component, inject} from '@angular/core';
import {BreakpointObserver, Breakpoints} from '@angular/cdk/layout';
import {toSignal} from '@angular/core/rxjs-interop';
import {map} from 'rxjs';
import {Player} from '../../services/game/models/player';
import {OverlayHandle} from '../../services/overlay/models/overlay-handle';
import {PlayerOverviewEntity} from './player-overview-entity/player-overview-entity.component';
import {GameService} from '../../services/game/game.service';

@Component({
  imports: [
    PlayerOverviewEntity
  ],
  selector: 'app-player-overview-drawer',
  styleUrl: './player-overview-drawer.component.scss',
  templateUrl: './player-overview-drawer.component.html',
  host: {
    '[class.isCompact]': 'isCompact()',
  }
})
export class PlayerOverviewDrawerComponent {

  protected readonly overlayHandle = inject(OverlayHandle);
  private readonly breakpointObserver = inject(BreakpointObserver);
  protected readonly gameService = inject(GameService);

  protected onDisconnectOrRelease(player: Player) {

    if (player.sessionInfo?.isConnected) {
      return this.gameService.dispatchKickAction(player.id, "Kicked by leader");
    }

    this.gameService.dispatchReleaseAction(player.id);
  }

  protected isCompact = toSignal(
    this.breakpointObserver.observe([Breakpoints.Handset])
      .pipe(
        map(data => data.matches),
      ), {initialValue: false}
  )
}
