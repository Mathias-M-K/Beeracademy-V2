import {Component, computed, inject, signal} from '@angular/core';
import {OVERLAY_DATA, OverlayHandle} from '../../services/overlay/models/overlay-handle';
import {DumbTimer} from './models/dumb-timer';
import {GameTimeFormatPipe} from '../../pipes/game-time-format-pipe';
import {Player} from '../../services/game/models/player';
import {CircleLoader} from '../../common/circle-loader/circle-loader';
import {
  ParticipantBadge
} from '../../pages/lobby-page/participant-overview/participant/participant-badge/participant-badge';
import {ChugOverlayData} from './models/chug-overlay-data';
import {Chug} from '../../../api-models/model/chug';

export interface OverlayChug {
  place: number;
  name: string;
  initial: string;
  time: number;
}

type ButtonState = 'start' | 'stop' | 'try-again';

const BUTTON_LABELS: Record<ButtonState, string> = {
  'start': 'Start tid',
  'stop': 'Stop tid',
  'try-again': 'Prøv igen',
};

@Component({
  selector: 'app-chug-overlay',
  templateUrl: './chug-overlay.html',
  styleUrl: './chug-overlay.scss',
  imports: [
    GameTimeFormatPipe,
    CircleLoader,
    ParticipantBadge
  ],
  host: {
    '[class.guest]': '!isGameClient'
  }
})
export class ChugOverlay {

  readonly overlayData = inject(OVERLAY_DATA) as ChugOverlayData;
  readonly overlayHandle = inject(OverlayHandle) as OverlayHandle<number>;

  protected readonly isGameClient = this.overlayData.isGameClient;
  protected readonly chugTimes = ChugOverlay.extractChugTimes(this.overlayData.players);

  protected readonly btnState = signal<ButtonState>('start');

  /** All three labels sit in the DOM at once, so the button names itself instead. */
  protected readonly btnLabel = computed(() => BUTTON_LABELS[this.btnState()]);

  private readonly timer: DumbTimer = new DumbTimer();
  protected readonly elapsedTime = this.timer.elapsedTime;
  protected readonly animateLoader = signal(false);

  protected readonly initial = ChugOverlay.initialOf(this.overlayData.playerToChug.name);

  private static extractChugTimes(players: Player[]): OverlayChug[] {
    return players
      .flatMap((player: Player) => (player.stats?.chugs ?? []).map((chug: Chug) => {
        const overlayChug: OverlayChug = {
          name: player.name,
          initial: ChugOverlay.initialOf(player.name),
          place: 0,
          time: chug.chugTimeMillis ?? 0,
        };
        return overlayChug;
      }))
      .sort((chug1, chug2) => chug1.time - chug2.time)
      .map((chug, index) => {
        chug.place = index + 1;
        return chug;
      });
  }

  private static initialOf(name: string): string {
    return name.charAt(0).toUpperCase();
  }

  protected dynamicBtnClick() {
    switch (this.btnState()) {
      case 'start':
        return this.startTimer()
      case 'stop':
        return this.stopTimer()
      case 'try-again':
        return this.reset();
    }
  }

  private startTimer() {
    this.btnState.set('stop');
    this.animateLoader.set(false);
    this.timer.startTimer();
  }

  private stopTimer() {
    this.btnState.set('try-again');
    this.timer.stopTimer();
  }

  private reset() {
    this.btnState.set('start');
    this.animateLoader.set(true);
    this.timer.resetTimer();
  }
}