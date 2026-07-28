import {Component, computed, input} from '@angular/core';

interface DotData {
  id: number;
}

@Component({
  selector: 'app-dot-indicator',
  imports: [],
  templateUrl: './dot-indicator.html',
  styleUrl: './dot-indicator.scss',
})
export class DotIndicator {

  readonly dotCount = input.required<number>();
  readonly dots = computed(() => {
    const dots: DotData[] = [];
    for (let i = 0; i < this.dotCount(); i++) {
      dots.push({id: i})
    }
    return dots;
  })


}
