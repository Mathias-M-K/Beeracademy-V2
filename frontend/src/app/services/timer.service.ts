import {computed, inject, Injectable} from '@angular/core';
import {GameService} from './game-service/game.service';

@Injectable({
  providedIn: 'root',
})
export class TimerService {

  private gameService = inject(GameService);

  private pausedTime = computed(()=> this.gameService.timeReport()?.pausedTime);

  constructor() {
    this.gameService.onGameStarted$.subscribe({next: value => this.onGameStarted()});
  }

  private onGameStarted(){

  }

}
