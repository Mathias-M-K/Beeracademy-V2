import { Component, computed, effect, input, signal, untracked } from '@angular/core';
import { ParticipantBadge } from '../../lobby-page/participant-overview/participant/participant-badge/participant-badge';
import { Player } from '../../../services/game/models/player';
import { CardComponent } from '../draw-panel/card/card.component';
import { DecimalPipe } from '@angular/common';
import { Chug } from '../../../../api-models/model/chug';

interface PodiumStep {
  placement: number;
  color: string;
  player: Player | undefined;
  time: number | undefined;
  animating: boolean;
}

const PLACEMENT_COLORS: Record<number, string> = { 1: 'goldenrod', 2: 'silver', 3: 'sandybrown' };

@Component({
  selector: 'app-podium',
  imports: [ParticipantBadge, CardComponent, DecimalPipe],
  templateUrl: './podium.component.html',
  styleUrl: './podium.component.scss',
})
export class PodiumComponent {
  readonly players = input<Player[]>();

  protected readonly placementColors = PLACEMENT_COLORS;

  protected readonly topThreePlayers = computed(
    () =>
      (this.players() ?? [])
        .filter((player) => this.bestChugTime(player) !== Infinity)
        .sort((a, b) => this.bestChugTime(a) - this.bestChugTime(b))
        .slice(0, 3),
    {
      equal: (a, b) => a.length === b.length && a.every((player, i) => player.id === b[i].id),
    },
  );

  protected readonly chugTimes = computed(() => {
    const chugs = (this.players() ?? [])
      .flatMap((player, seat) =>
        (player.stats?.chugs ?? []).map((chug) => ({
          name: player.name,
          chugTimeMillis: chug.chugTimeMillis,
          suit: chug.suit,
          round: this.roundOfChug(player, chug),
          seat,
        })),
      )
      .sort((a, b) => b.round - a.round || b.seat - a.seat);

    const ranked = chugs
      .map((chug) => chug.chugTimeMillis)
      .filter((time) => time !== undefined)
      .sort((a, b) => a - b);

    return chugs.map((chug) => ({
      ...chug,
      placement:
        chug.chugTimeMillis === undefined ? undefined : ranked.indexOf(chug.chugTimeMillis) + 1,
    }));
  });

  protected readonly podiumSteps = signal<PodiumStep[]>(
    [2, 1, 3].map((placement) => ({
      placement,
      color: PLACEMENT_COLORS[placement],
      player: undefined,
      time: undefined,
      animating: false,
    })),
  );

  constructor() {
    effect(() => {
      const topThree = this.topThreePlayers();
      untracked(() => topThree.forEach((_, i) => this.setAnimating(i + 1, true)));
    });
  }

  private bestChugTime(player: Player): number {
    const times = player.stats?.chugs?.map((chug) => chug.chugTimeMillis ?? Infinity) ?? [];
    return times.length ? Math.min(...times) : Infinity;
  }

  private roundOfChug(player: Player, chug: Chug): number {
    const aceTurn = player.stats?.turns?.find(
      (turn) => turn.card?.rank === 14 && turn.card.suit === chug.suit,
    );
    return aceTurn?.round ?? Infinity;
  }

  protected swapPlayer(placement: number) {
    const player = this.topThreePlayers()[placement - 1];
    this.updateStep(placement, { player, time: this.bestChugTime(player) });
  }

  protected setAnimating(placement: number, animating: boolean) {
    this.updateStep(placement, { animating });
  }

  private updateStep(placement: number, changes: Partial<PodiumStep>) {
    this.podiumSteps.update((steps) =>
      steps.map((step) => (step.placement === placement ? { ...step, ...changes } : step)),
    );
  }
}
