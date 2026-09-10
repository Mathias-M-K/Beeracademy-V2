import {Component, computed, input, Signal} from '@angular/core';
import {Player} from '../../../../services/game/models/player';
import {BeerDot} from './beer-dot/beer-dot';

export interface BeerIndicatorDot {
  fillLevel: number;
}

@Component({
  selector: 'app-player-card',
  templateUrl: './player-card.html',
  styleUrl: './player-card.scss',
  imports: [
    BeerDot
  ],
  host: {
    '[style.--player-color]': 'player().color'
  }
})
export class PlayerCard {

  readonly player = input.required<Player>();

  private readonly totalSips = computed(() =>
    this.player().stats?.turns?.reduce((sum, turn) => sum + (turn.card?.rank ?? 0), 0) ?? 0
  );
  protected readonly beerCount: Signal<number> = computed(() => {
    return (this.totalSips() / (this.player().sipsInABeer ?? 1));
  });

  protected readonly beerDots = computed(() => {

    let beerCount = this.beerCount();
    const dots: BeerIndicatorDot[] = [];
    for (let i = 0; i < this.beerCount(); i++) {

      if(beerCount > 1){
        dots.push({fillLevel: 100})
      }else{
        dots.push({fillLevel: (beerCount % 1)*100})
      }

      beerCount--;
    }

    return dots;

  })

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

  private readonly lastCard = computed(() => {
    return this.player().stats?.turns?.at(-1)?.card;
  });


}
