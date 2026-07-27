import {toSignal} from '@angular/core/rxjs-interop';
import {interval} from 'rxjs';
import {effect, signal} from '@angular/core';

export class DumbTimer{

  private readonly tick = toSignal(interval(31));

  private readonly _timerRunning = signal<boolean>(false)
  public readonly timerRunning = this._timerRunning.asReadonly();
  public readonly elapsedTime = signal<number>(0);


  private startTime!: number;

  constructor() {
    effect(() => {
      this.tick();

      if (this._timerRunning()){
        this.elapsedTime.set(Date.now() - this.startTime);
      }else{
        return;
      }

    });
  }

  startTimer(){
    this.startTime = Date.now();
    this._timerRunning.set(true);
  }

  stopTimer(){
    this._timerRunning.set(false);
  }
}
