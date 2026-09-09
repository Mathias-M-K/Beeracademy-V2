import {toSignal} from '@angular/core/rxjs-interop';
import {interval} from 'rxjs';
import {effect, signal} from '@angular/core';

export class DumbTimer {

  private readonly tick = toSignal(interval(31));

  private readonly _timerRunning = signal<boolean>(false)
  public readonly timerRunning = this._timerRunning.asReadonly();

  private readonly _elapsedTime = signal<number>(0);
  public readonly elapsedTime = this._elapsedTime.asReadonly();


  private startTime!: number;

  constructor(elapsedTime?: number) {
    this._elapsedTime.set(elapsedTime ?? 0);
    effect(() => {
      this.tick();
      if (!this._timerRunning()) return;

      this._elapsedTime.set(Date.now() - this.startTime);
    });
  }

  public startTimer() {
    this.startTime = Date.now() - this.elapsedTime();
    this._timerRunning.set(true);
  }

  public stopTimer() {
    this._timerRunning.set(false);
  }

  /** Stops as well as clears — otherwise the next tick would overwrite the 0. */
  public resetTimer() {
    this._timerRunning.set(false);
    this.startTime = 0;
    this._elapsedTime.set(0);
  }
}
