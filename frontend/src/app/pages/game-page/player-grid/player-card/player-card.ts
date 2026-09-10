import {Component, computed, input, Signal} from '@angular/core';
import {Player} from '../../../../services/game/models/player';
import {BeerDot} from './beer-dot/beer-dot';
import {SuitIcon} from '../../../../common/components/suit-icon/suit-icon';

export interface BeerIndicatorDot {
  fillLevel: number;
}

@Component({
  selector: 'app-player-card',
  templateUrl: './player-card.html',
  styleUrl: './player-card.scss',
  imports: [
    BeerDot,
    SuitIcon
  ],
  host: {
    '[style.--player-color]': 'player().color'
  }
})
export class PlayerCard {

  readonly player = input.required<Player>();

  private readonly totalSips = computed(() => {
    return this.player().stats?.turns?.reduce((sum, turn) => sum + (turn.card?.rank ?? 0), 0) ?? 0
  });

  protected readonly sipsLeftOfBeer = computed<number>(() => {
    const sipsLeft = this.player().sipsInABeer - (this.totalSips() % this.player().sipsInABeer);
    return sipsLeft === this.player().sipsInABeer ? 0 : sipsLeft;
  })

  protected readonly beerCount: Signal<number> = computed(() => {
    return (this.totalSips() / (this.player().sipsInABeer ?? 1));
  });

  protected readonly beerDots = computed<BeerIndicatorDot[]>(() => {
    const total = this.beerCount();

    // Always render at least one dot, so a fresh card shows an empty beer rather than an empty row.
    return Array.from({length: Math.max(Math.ceil(total), 1)}, (_, i) => ({
      fillLevel: Math.min(total - i, 1) * 100
    }));
  });

  private readonly sipsAvg = computed(() => {
    const turns = this.player().stats?.turns?.length ?? 0;
    const result = (this.totalSips() / turns);

    return Number.isNaN(result) ? 0 : result.toFixed(1);
  });

  //TODO remove if unused
  private readonly sipsLeftInBeer = computed(() => {
    if (this.totalSips() === 0) return 0;
    return (this.player().sipsInABeer ?? 0) - (this.totalSips() % (this.player().sipsInABeer ?? 0));
  })

  //TODO remove if unused
  private readonly sipsLeftInBeerAsPercentage = computed(() => {
    return this.sipsLeftInBeer() / (this.player().sipsInABeer ?? 0) * 100;
  })

  protected readonly lastCard = computed(() => {
    return this.player().stats?.turns?.at(-1)?.card;
  });

}
