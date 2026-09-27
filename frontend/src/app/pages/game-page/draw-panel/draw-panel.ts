import {
  AnimationCallbackEvent,
  Component,
  computed,
  inject,
  input,
  output,
  Signal,
} from '@angular/core';
import { Card } from '../../../../api-models/model/card';
import { map } from 'rxjs';
import { Player } from '../../../services/game/models/player';
import { toSignal } from '@angular/core/rxjs-interop';
import { BreakpointObserver } from '@angular/cdk/layout';
import { CardComponent } from './card/card.component';
import { Dot } from '../../../common/dot/dot';
import { playerColor } from '../../../common/theme/player-colors';
import { GameTimeFormatPipe } from '../../../pipes/game-time-format-pipe';
import { MaterialIcon } from '../../../common/components/material-icon/material-icon';
import { tweenedNumber } from '../../../common/tweened-number';
import { DecimalPipe } from '@angular/common';
import { GameService } from '../../../services/game/game.service';
import { DrawerService } from '../../../services/drawer/drawer.service';
import { PlayerTurn } from '../../../services/game/models/playerTurn';

@Component({
  selector: 'app-draw-panel',
  templateUrl: './draw-panel.html',
  styleUrl: './draw-panel.scss',
  imports: [CardComponent, DecimalPipe, Dot, GameTimeFormatPipe, MaterialIcon],
  host: {
    '[style.--player-color]': 'currentPlayer()?.color ?? "var(--primary)"',
  },
})
export class DrawPanel {
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly gameService = inject(GameService);
  protected readonly drawerService = inject(DrawerService);

  readonly drawCardClick = output<void>();

  readonly lastCard = input<Card | undefined>();
  readonly currentPlayer = input<Player | undefined>(undefined);
  readonly currentPlayerTime = input<number>(0);
  readonly turns = input<PlayerTurn[]>();
  readonly lastPlayer = input<Player | undefined>(undefined);
  readonly nextPlayer = input<Player | undefined>(undefined);
  readonly changeOfDrawingAce = input.required<number>();

  private readonly currentPlayerAvg = computed(() => {
    const turns = this.currentPlayer()?.stats.turns;
    if (!turns?.length) return 0;

    const totalTime = turns.reduce((sum, turn) => sum + (turn.durationInMillis ?? 0), 0);
    return totalTime / Math.max(turns.length - 1, 1);
  });
  protected readonly displayCurrentPlayerAvg = tweenedNumber(this.currentPlayerAvg);
  readonly currentPlayerAvgDelta = computed(
    () => this.currenPlayerLiveAvg() - this.currentPlayerAvg(),
  );
  private readonly currenPlayerLiveAvg = computed(() => {
    const turns = this.currentPlayer()?.stats.turns;
    if (!turns?.length) return 0;

    let totalTime = this.currentPlayerAvg() * Math.max(turns.length - 1, 1);
    totalTime = totalTime + this.currentPlayerTime();
    return totalTime / turns.length;
  });

  private readonly lastCardRank = computed(() => this.lastCard()?.rank ?? 0);
  protected readonly lastThreeCards: Signal<Card[]> = computed(() => {
    const cards = this.turns()
      ?.map((turn) => turn.info.card ?? undefined)
      .filter((card) => card !== undefined);

    return cards?.splice(-3).reverse() ?? [];
  });
  protected readonly displayLastCardRank = tweenedNumber(this.lastCardRank);

  protected displayLastPlayer = computed(() => {
    const rounds = this.turns()?.filter((turn) => turn !== undefined);
    if (!rounds?.length) return undefined;
    return this.lastPlayer();
  });
  private readonly lastPlayerTime = computed(
    () => this.lastPlayer()?.stats?.turns?.at(-1)?.durationInMillis ?? 0,
  );
  protected readonly displayLastPlayerTime = tweenedNumber(this.lastPlayerTime);

  protected readonly displayChangeOfDrawingAce = tweenedNumber(this.changeOfDrawingAce, {
    decimals: 2,
  });

  protected isPlayer = this.gameService.isPlayer;

  protected readonly isSemiCompact = toSignal(
    this.breakpointObserver.observe('(max-width: 850px)').pipe(map((result) => result.matches)),
    { initialValue: false },
  );

  protected readonly isCompact = toSignal(
    this.breakpointObserver.observe('(max-width: 500px)').pipe(map((result) => result.matches)),
    { initialValue: false },
  );

  protected delayLeave(event: AnimationCallbackEvent): void {
    setTimeout(() => event.animationComplete(), 350);
  }

  protected readonly playerColor = playerColor;
  protected readonly Math = Math;
}
