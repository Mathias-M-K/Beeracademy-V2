import {Component, input} from '@angular/core';
import {Card} from '../../../../../api-models/model/card';

@Component({
  selector: 'app-card',
  imports: [],
  templateUrl: './card.component.html',
  styleUrl: './card.component.scss',
  host: {
    '[class.backside]': 'isBackside()'
  },
})
export class CardComponent {

  readonly card = input<Card | undefined>();
  readonly isBackside = input<boolean>(false);

}
