import {Component, computed, inject, input, output} from '@angular/core';
import {Card} from '../../../../api-models/model/card';
import {last, map} from 'rxjs';
import {Player} from '../../../services/game/models/player';
import {toSignal} from '@angular/core/rxjs-interop';
import {BreakpointObserver} from '@angular/cdk/layout';
import {CardComponent} from './card/card.component';
import {Dot} from '../../../common/dot/dot';
import {playerColor} from '../../../common/theme/player-colors';
import {GameTimeFormatPipe} from '../../../pipes/game-time-format-pipe';
import {MaterialIcon} from '../../../common/components/material-icon/material-icon';
import {tweenedNumber} from '../../../common/tweened-number';
import {DecimalPipe} from '@angular/common';

@Component({
  selector: 'app-draw-panel',
  templateUrl: './draw-panel.html',
  styleUrl: './draw-panel.scss',
  imports: [
    CardComponent,
    DecimalPipe,
    Dot,
    GameTimeFormatPipe,
    MaterialIcon
  ],
  host: {
    '[style.--player-color]': 'currentPlayer()?.color ?? "var(--primary)"',
    '[style.--avg-progression.%]': 'currentPlayerTimeAvgPercentage()'
  }
})
export class DrawPanel {
  private readonly breakpointObserver = inject(BreakpointObserver);

  readonly drawCardClick = output<void>();

  readonly lastCard = input<Card | undefined>();
  private readonly lastCardRank = computed(() => this.lastCard()?.rank ?? 0);
  protected readonly displayLastCardRank = tweenedNumber(this.lastCardRank);
  readonly currentPlayer = input<Player | undefined>(undefined);
  readonly currentPlayerTime = input<number>(0);

  private readonly currentPlayerAvg = computed(() => {
    const turns = this.currentPlayer()?.stats.turns;
    if (!turns?.length) return 0;

    const totalTime = turns.reduce((sum, turn) => sum + (turn.durationInMillis ?? 0), 0);
    return totalTime / Math.max((turns.length - 1), 1);
  });
  private readonly currenPlayerLiveAvg = computed(() => {
    const turns = this.currentPlayer()?.stats.turns;
    if (!turns?.length) return 0;

    let totalTime = this.currentPlayerAvg() * Math.max((turns.length - 1), 1);
    totalTime = totalTime + this.currentPlayerTime();
    return totalTime / turns.length;
  })
  readonly currentPlayerAvgDelta = computed(() => this.currenPlayerLiveAvg() - this.currentPlayerAvg());
  readonly currentPlayerTimeAvgPercentage = computed(() => {
    const percentage = (this.currentPlayerTime() / (this.currentPlayerAvg()*1.25)) * 100;
    return Math.min(percentage, 100);
  })

  protected readonly displayCurrentPlayerAvg = tweenedNumber(this.currentPlayerAvg);


  readonly lastPlayer = input<Player | undefined>(undefined);
  readonly lastPlayerTime = computed(() => this.lastPlayer()?.stats?.turns?.at(-1)?.durationInMillis);

  readonly nextPlayer = input<Player | undefined>(undefined);

  readonly changeOfDrawingAce = input.required<number>();
  protected readonly displayChangeOfDrawingAce = tweenedNumber(this.changeOfDrawingAce, {decimals: 2});

  protected readonly isCompact = toSignal(
    this.breakpointObserver.observe('(max-width: 650px)').pipe(map((result) => result.matches)),
    {initialValue: false},
  );

  protected readonly last = last;
  protected readonly playerColor = playerColor;
}
