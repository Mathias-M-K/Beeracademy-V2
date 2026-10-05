import { Component, computed, effect, inject, OnDestroy, signal, untracked } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { GameService } from '../../services/game/game.service';
import { TimerService } from '../../services/timer-service/timer.service';
import { TimerState } from '../../../api-models/model/timerState';
import { TimerType } from '../../services/timer-service/models/TimerType';
import { CardCount } from './card-count/card-count';
import { DrawPanel } from './draw-panel/draw-panel';
import { PodiumComponent } from './podium/podium.component';
import { PlayerGrid } from './player-grid/player-grid';
import { SegmentedControl } from '../../common/segmented-control/segmented-control';
import { SwipePager } from '../../common/swipe-pager/swipe-pager';
import { SwipePage } from '../../common/swipe-pager/swipe-page';

@Component({
  selector: 'app-game-page',
  imports: [
    CardCount,
    DrawPanel,
    PodiumComponent,
    PlayerGrid,
    SegmentedControl,
    SwipePager,
    SwipePage,
  ],
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
  protected previousPlayer = this.gameService.previousPlayer;
  protected nextPlayer = this.gameService.nextPlayer;
  protected turns = this.gameService.turns;
  protected chugs = this.gameService.chugs;

  protected currentRound = this.gameService.currentRound;
  protected timerState = computed(() => this.gameService.gameTimeReport()?.state);

  protected formattedPlayerTime = this.playerTimer.currentDuration;

  protected remainingCardsByRank = this.gameService.remainingCardsByRank;
  protected changeOfDrawingAce = this.gameService.changeOfDrawingAce;

  protected readonly isCompact = toSignal(
    inject(BreakpointObserver)
      .observe('(max-width: 500px)')
      .pipe(map((result) => result.matches)),
    { initialValue: false },
  );

  protected readonly pageNames = ['Spil', 'Podie'];
  protected readonly selectedPage = signal(0);
  private readonly gamePageIndex = 0;
  private readonly podiumPageIndex = 1;
  private readonly pageSwitchDelayMs = 200;

  constructor() {
    effect(() => {
      if (this.currentCard()?.rank !== 14 || !untracked(this.isCompact)) return;
      this.selectedPage.set(this.podiumPageIndex);
    });
  }

  ngOnDestroy() {
    this.gameService.onGamePageDestroyed();
  }

  protected drawCard() {
    const turnDuration = this.playerTimer.currentDuration() ?? 0;

    if (!this.isCompact() || this.selectedPage() === this.gamePageIndex) {
      this.gameService.dispatchDrawCardAction(turnDuration);
      return;
    }

    this.selectedPage.set(this.gamePageIndex);
    setTimeout(() => this.gameService.dispatchDrawCardAction(turnDuration), this.pageSwitchDelayMs);
  }

  protected readonly TimerState = TimerState;
}
