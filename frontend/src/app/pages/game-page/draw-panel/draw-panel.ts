import {Component, inject, input, output} from '@angular/core';
import {CardComponent} from './card/card.component';
import {Card} from '../../../../api-models/model/card';
import {last, map} from 'rxjs';
import {GameTimeFormatPipe} from '../../../pipes/game-time-format-pipe';
import {Player} from '../../../services/game/models/player';
import {toSignal} from '@angular/core/rxjs-interop';
import {BreakpointObserver} from '@angular/cdk/layout';

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

  private readonly breakpointObserver = inject(BreakpointObserver);

  readonly currentCard = input<Card | undefined>();
  readonly currentPlayer = input<Player | undefined>();
  readonly currentPlayerTime = input<number>(0);
  readonly drawCardClick = output<void>();

  protected readonly isCompact = toSignal(
    this.breakpointObserver
      .observe('(max-width: 650px)')
      .pipe(map((result) => result.matches)),
    { initialValue: false },
  );

  protected readonly last = last;
}
