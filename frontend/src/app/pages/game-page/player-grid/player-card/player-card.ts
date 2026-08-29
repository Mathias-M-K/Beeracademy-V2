import {Component, computed, input, Signal} from '@angular/core';
import {BeerBottle} from '../../../../common/components/beer-bottle/beer-bottle';
import {Player} from '../../../../services/game/models/player';

@Component({
  selector: 'app-player-card',
  imports: [
    BeerBottle
  ],
  templateUrl: './player-card.html',
  styleUrl: './player-card.scss',
  host:{
    '[style.--player-color]': 'player().color'
  }
})
export class PlayerCard {

  readonly player = input.required<Player>();

  readonly totalSips = computed(() =>
    this.player().stats?.turns?.reduce((sum, turn) => sum + (turn.card?.rank ?? 0), 0) ?? 0
  );
  readonly beers: Signal<number> = computed(() =>{
    return (this.totalSips() / (this.player().sipsInABeer ?? 1));
  })
  readonly sipsAvg = computed(() =>{
    const turns = this.player().stats?.turns?.length ?? 0;
    const result = (this.totalSips() / turns);

    return Number.isNaN(result) ? 0 : result.toFixed(1);
  });
  readonly sipsLeftInBeer = computed(() =>{
    if (this.totalSips() === 0) return 0;
    return (this.player().sipsInABeer??0) - (this.totalSips() % (this.player().sipsInABeer ?? 0));
  })

  readonly sipsLeftInBeerAsPercentage = computed(()=>{
    return this.sipsLeftInBeer() / (this.player().sipsInABeer??0) * 100;
  })

  readonly lastCard = computed(() => {
    return this.player().stats?.turns?.at(-1)?.card;
  });

  // One entry per fully consumed beer; the template only cares about the count.
  readonly beersConsumed = computed(() => Array.from({length: Math.floor(this.beers())}));

}
