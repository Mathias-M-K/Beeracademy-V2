import {computed, inject, Injectable, Signal} from '@angular/core';
import {interval} from 'rxjs';
import {toSignal} from '@angular/core/rxjs-interop';
import {GameService} from '../game-service/game.service';
import {TimerState} from '../../../api-models/model/timerState';
import {TimerType} from './models/TimerType';
import {Timer} from './models/Timer';
import {TimeReport} from '../../../api-models/model/timeReport';


@Injectable({
  providedIn: 'root',
})
export class TimerService {
  private gameService: GameService = inject(GameService);
  private tick = toSignal(interval(31));

  private timers: Map<TimerType, Timer> = new Map<TimerType, Timer>();

  public getTimer(timer: TimerType) : Timer {

    if (!this.timers.has(timer)) {
      const timeReportSignal = timer === TimerType.GAME ? this.gameService.gameTimeReport : this.gameService.playerTimeReport;
      this.timers.set(timer, this.createServerSyncedTimer(timeReportSignal));
    }

    return this.timers.get(timer)!;

  }

  public createServerSyncedTimer(timeReport: Signal<TimeReport | undefined>): Timer {

    const serverReportedActiveTime = computed(()=> timeReport()?.activeTime);

    const clientAnchorTime = computed(()=>{
      const report = timeReport();
      this.gameService.currentPlayer();
      return report;
    }, { equal: (a, b) => a === b });

    const anchorDate = computed(() => {
      clientAnchorTime();
      return Date.now();
    });

    const isRunning = computed(()=> timeReport()?.state === TimerState.Running);

    const clientToServerDiff = computed(()=> {
      return Math.abs((Date.now() - anchorDate()) - (serverReportedActiveTime() ?? 0));
    });

    const currentDuration = computed(()=>{
      this.tick();

      if (!isRunning()) {
        return serverReportedActiveTime();
      }

      return clientToServerDiff() + (Date.now() - anchorDate())
    });

    return {
      clientAnchorTime: anchorDate,
      clientToServerDiff: clientToServerDiff,
      currentDuration: currentDuration,
      isRunning: isRunning,
      serverReportedActiveTime: serverReportedActiveTime
    };
  }







  // private lastestServerTime = computed(()=>this.gameService.timeReports()?.gameTimeReport?.activeTime);
  //
  // private clientAnchorTime = computed(()=>{
  //   this.lastestServerTime();
  //   return Date.now();
  // });
  //
  // private isRunning = computed(() => this.gameService.timeReports()?.gameTimeReport?.state === TimerState.Running);
  //
  // private gameToClientDiff = computed(() => {
  //   return Math.abs((Date.now() - this.clientAnchorTime()) - this.gameService.timeReports()?.gameTimeReport?.activeTime!);
  // });
  //
  // public currentTime = computed(() => {
  //   this.tick();
  //
  //   if (!this.isRunning()) {
  //     return this.lastestServerTime();
  //   }
  //
  //   return this.gameToClientDiff() + (Date.now() - this.clientAnchorTime())
  // });
}
