import { Component, computed, inject, OnDestroy } from '@angular/core';
import { GameService } from '../../services/game/game.service';
import { TimerService } from '../../services/timer-service/timer.service';
import { TimerState } from '../../../api-models/model/timerState';
import { TimerType } from '../../services/timer-service/models/TimerType';
import { CardCount } from './card-count/card-count';
import { DrawPanel } from './draw-panel/draw-panel';
import { PodiumComponent } from './podium/podium.component';
import { PlayerGrid } from './player-grid/player-grid';

@Component({
  selector: 'app-game-page',
  imports: [CardCount, DrawPanel, PodiumComponent, PlayerGrid],
  templateUrl: './game-page.html',
  styleUrl: './game-page.scss',
  host: {
    '(document:keyup.space)': 'drawCard()',
  },
})
export class GamePage implements OnDestroy {

  private readonly playerTimer = inject(TimerService).getTimer(TimerType.PLAYER);
  private readonly gameService: GameService = inject(GameService);

  protected players = this.gameService.players;
  protected gameInfo = this.gameService.gameInfo;
  protected currentCard = this.gameService.currentCard;
  protected currentPlayer = this.gameService.currentPlayer;

  protected currentRound = this.gameService.currentRound;
  protected timerState = computed(() => this.gameService.gameTimeReport()?.state);

  protected formattedPlayerTime = this.playerTimer.currentDuration;

  protected remainingCardsByRank = this.gameService.remainingCardsByRank;

  ngOnDestroy() {
    this.gameService.onGamePageDestroyed();
  }

  protected drawCard() {
    this.gameService.dispatchDrawCardAction(this.playerTimer.currentDuration() ?? 0);
  }


  protected readonly TimerState = TimerState;
}
