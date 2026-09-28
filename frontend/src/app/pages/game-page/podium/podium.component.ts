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
const ACE_RANK = 14;

@Component({
  selector: 'app-podium',
  imports: [ParticipantBadge, CardComponent, DecimalPipe],
  templateUrl: './podium.component.html',
  styleUrl: './podium.component.scss',
})
export class PodiumComponent {
  readonly players = input<Player[]>();

  protected readonly placementColors = PLACEMENT_COLORS;
  protected readonly aceRank = ACE_RANK;

  protected readonly topThree = computed(
    () =>
      (this.players() ?? [])
        .map((player) => ({ player, time: this.bestChugTime(player) }))
        .filter((entry) => entry.time !== Infinity)
        .sort((a, b) => a.time - b.time)
        .slice(0, 3),
    {
      equal: (a, b) =>
        a.length === b.length &&
        a.every((entry, i) => entry.player.id === b[i].player.id && entry.time === b[i].time),
    },
  );

  protected readonly chugHistory = computed(() => {
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
      const topThree = this.topThree();
      untracked(() =>
        topThree.forEach((entry, i) => {
          const step = this.podiumSteps().find((s) => s.placement === i + 1);
          if (step?.player?.id !== entry.player.id || step.time !== entry.time) {
            this.setAnimating(i + 1, true);
          }
        }),
      );
    });
  }

  private bestChugTime(player: Player): number {
    const times = player.stats?.chugs?.map((chug) => chug.chugTimeMillis ?? Infinity) ?? [];
    return times.length ? Math.min(...times) : Infinity;
  }

  private roundOfChug(player: Player, chug: Chug): number {
    const aceTurn = player.stats?.turns?.find(
      (turn) => turn.card?.rank === ACE_RANK && turn.card.suit === chug.suit,
    );
    return aceTurn?.round ?? Infinity;
  }

  protected swapPlayer(placement: number) {
    this.updateStep(placement, this.topThree()[placement - 1]);
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
