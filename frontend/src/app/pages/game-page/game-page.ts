import {
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  OnDestroy,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
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

@Component({
  selector: 'app-game-page',
  imports: [CardCount, DrawPanel, PodiumComponent, PlayerGrid, SegmentedControl],
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

  private readonly scroller = viewChild('scroller', { read: ElementRef<HTMLElement> });
  private readonly pages = viewChildren('page', { read: ElementRef<HTMLElement> });

  private dragActive = false;
  private rafId = 0;

  constructor() {
    effect(() => {
      this.scrollToIndex(this.selectedPage());
    });
  }

  ngOnDestroy() {
    this.gameService.onGamePageDestroyed();
  }

  protected onPointerDown(): void {
    this.dragActive = true;
  }

  protected onPageSelected(): void {
    this.dragActive = false;
  }

  protected onScroll(): void {
    if (!this.dragActive || this.rafId) return;
    this.rafId = requestAnimationFrame(() => {
      this.rafId = 0;
      this.selectedPage.set(this.nearestPageIndex());
    });
  }

  protected onScrollEnd(): void {
    this.selectedPage.set(this.nearestPageIndex());
  }

  private scrollToIndex(index: number): void {
    if (this.dragActive) return;
    const container = this.scroller()?.nativeElement;
    const page = this.pages()[index]?.nativeElement;
    if (!container || !page) return;

    const offset = page.getBoundingClientRect().left - container.getBoundingClientRect().left;
    container.scrollTo({ left: container.scrollLeft + offset, behavior: 'smooth' });
  }

  private nearestPageIndex(): number {
    const scroller = this.scroller()?.nativeElement;
    const [first, second] = this.pages().map((page) => page.nativeElement);
    if (!scroller || !first || !second) return 0;

    const pageDistance = second.offsetLeft - first.offsetLeft;
    return Math.round(scroller.scrollLeft / pageDistance);
  }

  protected drawCard() {
    this.gameService.dispatchDrawCardAction(this.playerTimer.currentDuration() ?? 0);
  }

  protected readonly TimerState = TimerState;
}
