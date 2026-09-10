import {Component, input} from '@angular/core';
import {Card} from '../../../../../api-models/model/card';
import {SuitIcon} from '../../../../common/components/suit-icon/suit-icon';

@Component({
  selector: 'app-card',
  imports: [
    SuitIcon
  ],
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
