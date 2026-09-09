import {Component, inject} from '@angular/core';
import {MaterialIcon} from '../../common/components/material-icon/material-icon';
import {OVERLAY_DATA, OverlayHandle} from '../../services/overlay/models/overlay-handle';
import {GamePausedData} from './models/game-paused-data';
import {IsGameOwnerDirective} from '../../directives/is-game-owner.directive';
import {GameTimeFormatPipe} from '../../pipes/game-time-format-pipe';
import {DumbTimer} from '../../overlay/chug-overlay/models/dumb-timer';
import {
  ParticipantBadge
} from '../../pages/lobby-page/participant-overview/participant/participant-badge/participant-badge';
import {DrawerService} from '../../services/drawer/drawer.service';
import {IsPlayerDirective} from '../../directives/is-player.directive';

@Component({
  imports: [
    MaterialIcon,
    IsGameOwnerDirective,
    GameTimeFormatPipe,
    ParticipantBadge,
    IsPlayerDirective
  ],
  selector: 'app-game-paused-drawer',
  styleUrl: './game-paused-drawer.component.scss',
  templateUrl: './game-paused-drawer.component.html',
})
export class GamePausedDrawerComponent {

  protected readonly overlayHandle = inject(OverlayHandle);
  protected readonly gamePauseData: GamePausedData = inject(OVERLAY_DATA) as GamePausedData;
  protected readonly drawerService = inject(DrawerService);

  protected timer: DumbTimer;

  constructor() {
    this.timer = new DumbTimer(this.gamePauseData.currentPauseTime);
    this.timer.startTimer();
  }

  protected resumeGame(): void {
    this.overlayHandle.close();
  }
}
