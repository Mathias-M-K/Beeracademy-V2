import {computed, inject, Injectable} from '@angular/core';
import {interval} from 'rxjs';
import {toSignal} from '@angular/core/rxjs-interop';
import {GameService} from './game-service/game.service';
import {TimerState} from '../../api-models/model/timerState';


@Injectable({
  providedIn: 'root',
})
export class TimerService {

  private gameService: GameService = inject(GameService);

  private tick = toSignal(interval(30));

  private latestConfirmedTimeFromServer = computed(()=>this.gameService.timeReport()?.activeTime)
  private clientAnchorTime = computed(()=>{
    this.isRunning();
    return Date.now();
  });
  private isRunning = computed(() => this.gameService.timeReport()?.state === TimerState.Running);

  private gameToClientDiff = computed(() => {
    return Math.abs((Date.now() - this.clientAnchorTime()) - this.gameService.timeReport()?.activeTime!);
  });

  public currentTime = computed(() => {
    this.tick();

    if (!this.isRunning()) {
      return this.latestConfirmedTimeFromServer();
    }

    return this.gameToClientDiff() + (Date.now() - this.clientAnchorTime())
  });
}
