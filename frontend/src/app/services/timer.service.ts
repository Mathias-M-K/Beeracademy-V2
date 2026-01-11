import {computed, effect, Injectable, signal} from '@angular/core';
import {GameService} from './game-service/game.service';
import {interval} from 'rxjs';
import {toSignal} from '@angular/core/rxjs-interop';
import {TimerState} from '../../api-models/model/timerState';


@Injectable({
  providedIn: 'root',
})
export class TimerService {

  private tick = toSignal(interval(30));
  private localTimerStartedAt = signal(0);
  private baseTime = signal(0);

  private isRunning = signal(false);

  public currentTime = computed(() => {
    const base = this.baseTime();
    if (!this.isRunning()) {
      return base;
    }
    this.tick();
    return base + (Date.now() - this.localTimerStartedAt());
  });

  constructor(private gameService: GameService) {

    this.gameService.onGameStarted$.subscribe({
      next: () => {
        this.localTimerStartedAt.set(Date.now())
        this.isRunning.set(true);
      }
    })


    effect(() => {
      const report = this.gameService.timeReport();
      if (!report) {
        return;
      }

      if (report.state === TimerState.Running) {
        this.baseTime.set(report.activeTime ?? 0);
        this.localTimerStartedAt.set(Date.now());
        this.isRunning.set(true);
      } else if (report.state === TimerState.Paused) {
        this.baseTime.set(report.activeTime ?? 0);
        this.isRunning.set(false);
      } else if (report.state === TimerState.NotStarted) {
        this.baseTime.set(0);
        this.isRunning.set(false);
      }

    });
  }

  public startGameTimer() {
    this.isRunning.set(true);
  }


}
