import {Component, computed, input} from '@angular/core';

@Component({
  selector: 'app-beer-bottle',
  imports: [],
  templateUrl: './beer-bottle.html',
  styleUrl: './beer-bottle.scss',
  host: {
    '[style.--beer-color]': 'color()',
    '[style.--beer-fill]': 'fillPercent()',
  },
})
export class BeerBottle {

  readonly color = input('rebeccapurple');
  readonly fillLevel = input(100);

  protected readonly fillPercent = computed(() => `${Math.max(0, Math.min(100, this.fillLevel()))}%`);
}
