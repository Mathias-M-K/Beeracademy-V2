import {Signal} from '@angular/core';

export interface Timer{
  serverReportedActiveTime: Signal<number | undefined>
  clientAnchorTime: Signal<number>
  isRunning: Signal<boolean>
  clientToServerDiff: Signal<number>
  currentDuration: Signal<number | undefined>
}
