import { Component, input } from '@angular/core';

@Component({
  imports: [],
  selector: 'app-dot',
  styleUrl: './dot.scss',
  templateUrl: './dot.html',
  host: {
    '[style.--dot-color]': 'color()',
    '[style.--dot-radius.px]': 'radiusPx()',
  },
})
export class Dot {
  readonly radiusPx = input<number>(15);
  readonly color = input<string>('var(--primary)');
}
