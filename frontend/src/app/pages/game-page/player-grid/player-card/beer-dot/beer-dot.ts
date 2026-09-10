import {Component, input} from '@angular/core';

@Component({
  imports: [],
  selector: 'app-beer-dot',
  styleUrl: './beer-dot.scss',
  templateUrl: './beer-dot.html',
  host: {
    '[style.--foreground-color]': 'foregroundColor()',
    '[style.--fill-level.%]': 'fill()'
  }
})
export class BeerDot {

  readonly foregroundColor = input<string>('foregroundColor');
  readonly fill = input<number>(100);
}
