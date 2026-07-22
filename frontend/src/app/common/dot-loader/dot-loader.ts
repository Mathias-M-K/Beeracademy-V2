import {Component, input} from '@angular/core';

@Component({
  selector: 'app-dot-loader',
  imports: [],
  templateUrl: './dot-loader.html',
  styleUrl: './dot-loader.scss',
  host: {
    '[style.--dot-color]': 'color()',
  }
})
export class DotLoader {

  readonly color = input('#DC8224FF');
}
