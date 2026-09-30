import { Component, input } from '@angular/core';
import { Card } from '../../../../../api-models/model/card';
import { SuitIcon } from '../../../../common/components/suit-icon/suit-icon';
import { CardRankPipe } from '../../../../pipes/card-rank-pipe';

@Component({
  selector: 'app-card',
  imports: [SuitIcon, CardRankPipe],
  templateUrl: './card.component.html',
  styleUrl: './card.component.scss',
  host: {
    '[class.backside]': 'isBackside()',
    '[class.small]': 'size() === "small"',
  },
})
export class CardComponent {
  readonly card = input<Card | undefined>();
  readonly isBackside = input<boolean>(false);
  readonly size = input<'small' | 'default'>();
}
