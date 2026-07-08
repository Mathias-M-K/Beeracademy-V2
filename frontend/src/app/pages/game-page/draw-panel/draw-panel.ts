import {Component, input, output} from '@angular/core';
import {CardComponent} from './card/card.component';
import {Card} from '../../../../api-models/model/card';
import {PlayerDto} from '../../../../api-models/model/playerDto';
import {last} from 'rxjs';
import {GameTimeFormatPipe} from '../../../pipes/game-time-format-pipe';

@Component({
  selector: 'app-draw-panel',
  imports: [
    CardComponent,
    GameTimeFormatPipe
  ],
  templateUrl: './draw-panel.html',
  styleUrl: './draw-panel.scss',
})
export class DrawPanel {

  readonly currentCard = input<Card | undefined>();
  readonly currentPlayer = input<PlayerDto | undefined>();
  readonly currentPlayerTime = input<number>(0);
  readonly drawCardClick = output<void>();

  protected readonly last = last;
}
