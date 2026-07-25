import {Component, inject} from '@angular/core';
import {OVERLAY_DATA, OverlayHandle} from '../../services/overlay/models/overlay-handle';
import {DumbTimer} from './models/dumb-timer';
import {GameTimeFormatPipe} from '../../pipes/game-time-format-pipe';
import {Player} from '../../services/game/models/player';

@Component({
  selector: 'app-chug-overlay',
  templateUrl: './chug-overlay.html',
  styleUrl: './chug-overlay.scss',
  imports: [
    GameTimeFormatPipe
  ]
})
export class ChugOverlay {

  readonly overlayData = inject(OVERLAY_DATA) as Player;
  readonly overlayHandle = inject(OverlayHandle) as OverlayHandle<number>;

  private readonly timer: DumbTimer = new DumbTimer();
  readonly elapsedTime = this.timer.elapsedTime;
  readonly timerRunning = this.timer.timerRunning;



  startTimer(){
    this.timer.startTimer();
  }

  protected stopTimer() {
    this.timer.stopTimer();
  }
}
