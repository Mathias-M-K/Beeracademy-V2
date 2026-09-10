import {Component, computed, input, Signal} from '@angular/core';
import {Player} from '../../../../services/game/models/player';
import {BeerDot} from './beer-dot/beer-dot';
import {SuitIcon} from '../../../../common/components/suit-icon/suit-icon';
import {tweenedNumber} from '../../../../common/tweened-number';
import {GameTimeFormatPipe} from '../../../../pipes/game-time-format-pipe';

export interface BeerIndicatorDot {
  fillLevel: number;
}

@Component({
  selector: 'app-player-card',
  templateUrl: './player-card.html',
  styleUrl: './player-card.scss',
  imports: [
    GameTimeFormatPipe,
    BeerDot,
    SuitIcon
  ],
  host: {
    '[style.--player-color]': 'player().color'
  }
})
export class PlayerCard {

  readonly player = input.required<Player>();

  protected readonly totalSips = computed(() => {
    return this.player().stats?.turns?.reduce((sum, turn) => sum + (turn.card?.rank ?? 0), 0) ?? 0
  });

  private readonly sipsLeftOfBeer = computed<number>(() => {
    const sipsLeft = this.player().sipsInABeer - (this.totalSips() % this.player().sipsInABeer);
    return sipsLeft === this.player().sipsInABeer ? 0 : sipsLeft;
  })

  private readonly beerCount: Signal<number> = computed(() => {
    return (this.totalSips() / (this.player().sipsInABeer ?? 1));
  });

  protected readonly displayedBeerCount = tweenedNumber(this.beerCount);

  private readonly tweenedSipsLeft = tweenedNumber(this.sipsLeftOfBeer);
  protected readonly displayedSipsLeft = computed(() => Math.round(this.tweenedSipsLeft()));

  protected readonly beerDots = computed<BeerIndicatorDot[]>(() => {
    const total = this.beerCount();

    // Always render at least one dot, so a fresh card shows an empty beer rather than an empty row.
    return Array.from({length: Math.max(Math.ceil(total), 1)}, (_, i) => ({
      fillLevel: Math.min(total - i, 1) * 100
    }));
  });

  protected readonly sipsAvg = computed(() => {
    const turns = this.player().stats?.turns?.length ?? 0;
    const result = (this.totalSips() / turns);

    return Number.isNaN(result) ? 0 : result.toFixed(1);
  });

  protected readonly lastCard = computed(() => {
    return this.player().stats?.turns?.at(-1)?.card;
  });

  protected readonly lastRoundTime = computed(() => {
    return this.player().stats?.turns?.at(-1)?.durationInMillis;
  })

  protected readonly roundTimesAvg = computed(() => {

    const turns = this.player().stats?.turns;
    if(!turns) return 0;

    const turnsCount = turns.length;
    const turnsSum = turns.reduce((sum, turn) => sum + (turn.durationInMillis??0), 0);

    return turnsSum / turnsCount;
  })

}
