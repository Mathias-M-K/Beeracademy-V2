import {Component, computed, input, output} from '@angular/core';

interface DotData {
  id: number;
}

@Component({
  selector: 'app-dot-indicator',
  imports: [],
  templateUrl: './dot-indicator.html',
  styleUrl: './dot-indicator.scss',
  host: {
    '[style.--active-index]':'activeIndex()'
  }
})
export class DotIndicator {

  readonly dotCount = input.required<number>();
  readonly activeIndex = input<number>();
  readonly dotClick = output<number>();

  private readonly offset = 30;

  readonly dots = computed(() => {
    const dots: DotData[] = [];
    for (let i = 0; i < this.dotCount(); i++) {
      dots.push({id: i})
    }
    return dots;
  })


}
