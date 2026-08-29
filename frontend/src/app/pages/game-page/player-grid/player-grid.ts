import {
  Component,
  ElementRef,
  effect,
  input,
  signal,
  viewChild,
  viewChildren,
  linkedSignal,
  inject
} from '@angular/core';
import {PlayerCard} from './player-card/player-card';
import {Player} from '../../../services/game/models/player';
import {DotIndicator} from '../../../common/dot-indicator/dot-indicator';
import {toSignal} from '@angular/core/rxjs-interop';
import {map} from 'rxjs';
import {BreakpointObserver} from '@angular/cdk/layout';

@Component({
  selector: 'app-player-grid',
  imports: [
    PlayerCard,
    DotIndicator
  ],
  templateUrl: './player-grid.html',
  styleUrl: './player-grid.scss',
})
export class PlayerGrid {

  private readonly breakpointObserver = inject(BreakpointObserver);

  readonly players = input.required<Player[] | undefined>();
  readonly activePlayerId = input<string>();

  private readonly scroller = viewChild('scroller', {read: ElementRef<HTMLElement>});
  private readonly playerCardElements = viewChildren('playerElement', {read: ElementRef<HTMLElement>});

  /** Live index of the card nearest the carousel centre — drives the dots. */
  protected readonly visiblePlayerIndex = signal(0);

  readonly playerDragActive = linkedSignal(()=> {
    this.activePlayerId();
    return false;
  });

  protected readonly isCompact = toSignal(
    this.breakpointObserver
      .observe('(max-width: 500px)')
      .pipe(map((result) => result.matches)),
    { initialValue: false },
  );

  private rafId = 0;

  constructor() {
    // Auto-follow: scroll to the current player whenever the turn changes (and once the cards exist).
    effect(() => {
      const players = this.players() ?? [];
      const index = players.findIndex((player) => player.id === this.activePlayerId());
      if (index >= 0 && this.isCompact()) {
        this.scrollToIndex(index);
      }
    });
  }

  protected scrollToPlayerCard(index: number): void {
    this.playerDragActive.set(false);
    this.scrollToIndex(index);
  }

  /** Updates the dots once, after the carousel settles on a card. Template: `(scrollend)`. */
  protected onScrollEnd(): void {
    if (this.playerDragActive()) return;
    this.visiblePlayerIndex.set(this.nearestCardIndex());
  }

  /** Live-updates the visible index as the user scrolls, batched to one write per frame. Template: `(scroll)`. */
  protected onScroll(): void {
    if(!this.playerDragActive()) return;
    if (this.rafId) return;
    this.rafId = requestAnimationFrame(() => {
      this.rafId = 0;
      this.visiblePlayerIndex.set(this.nearestCardIndex());
    });
  }

  private scrollToIndex(index: number): void {
    this.visiblePlayerIndex.set(index);
    this.playerCardElements()[index]?.nativeElement.scrollIntoView({
      behavior: 'smooth',
      inline: 'center',
      block: 'nearest',
    });
  }

  /** Index of the card whose centre is closest to the carousel's scroll centre. */
  private nearestCardIndex(): number {
    const container = this.scroller()?.nativeElement;
    const cards = this.playerCardElements();
    if (!container || cards.length === 0) return 0;

    const center = container.scrollLeft + container.clientWidth / 2;

    let nearest = 0;
    let smallestDistance = Infinity;
    cards.forEach((card, index) => {
      const el = card.nativeElement;
      const cardCenter = el.offsetLeft + el.offsetWidth / 2;
      const distance = Math.abs(cardCenter - center);
      if (distance < smallestDistance) {
        smallestDistance = distance;
        nearest = index;
      }
    });

    return nearest;
  }
}
