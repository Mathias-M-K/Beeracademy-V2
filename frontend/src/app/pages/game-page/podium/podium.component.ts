import {Component, computed, effect, input, Signal, signal, untracked} from '@angular/core';
import {ParticipantBadge} from '../../lobby-page/participant-overview/participant/participant-badge/participant-badge';
import {Player} from '../../../services/game/models/player';
import {CardComponent} from '../draw-panel/card/card.component';
import {DecimalPipe} from '@angular/common';
import {Suit} from '../../../../api-models/model/suit';

interface PodiumStep {
  placement: number;
  color: string;
  player: Player | undefined;
  time: number | undefined;
  animating: boolean;
}

interface ChugTime{
  name: string;
  chugTimeMillis: number | undefined;
  suit: Suit | undefined;
  placement: number | undefined;
}

@Component({
  selector: 'app-podium',
  imports: [ParticipantBadge, CardComponent, DecimalPipe],
  templateUrl: './podium.component.html',
  styleUrl: './podium.component.scss',
})
export class PodiumComponent {
  readonly players = input<Player[]>();

  readonly topThreePlayers = computed(() =>
      [...(this.players() ?? [])]
        .sort((a, b) => this.bestChugTime(a) - this.bestChugTime(b))
        .filter((player) => this.bestChugTime(player) !== Infinity)
        .slice(0, 3),
    {
      equal: (a, b) => a.length === b.length && a.every((player, i) => player.id === b[i].id)
    }
  );

  readonly chugTimes: Signal<ChugTime[]> = computed(() => {
    const chugs = (this.players() ?? []).flatMap((player) =>
      (player.stats?.chugs ?? []).map((chug) => ({
        name: player.name,
        chugTimeMillis: chug.chugTimeMillis,
        suit: chug.suit,
      })),
    );

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
    [
      {placement: 2, color: 'silver', player: undefined, time: undefined, animating: false},
      {placement: 1, color: 'goldenrod', player: undefined, time: undefined, animating: false},
      {placement: 3, color: 'sandybrown', player: undefined, time: undefined, animating: false},
    ]
  )

  constructor() {
    effect(() => {
      const topThree = this.topThreePlayers();
      untracked(() =>
        topThree.forEach((_, index) => {
          const step = this.getStepFromPlacement(index + 1);
          if (step) this.setAnimating(step, true);
        }),
      );
    });
  }


  private bestChugTime(player: Player): number {
    const times = player.stats?.chugs?.map((chug) => chug.chugTimeMillis ?? Infinity) ?? [];
    return times.length ? Math.min(...times) : Infinity;
  }

  protected swapPlayer(step: PodiumStep) {
    const player = this.topThreePlayers()[step.placement - 1];
    this.updateStep(step, {player: player, time: this.bestChugTime(player)});
  }

  protected setAnimating(step: PodiumStep, animating: boolean) {
    this.updateStep(step, {animating});
  }

  private getStepFromPlacement(placement: number) {
    return this.podiumSteps().find((step) => step.placement === placement);
  }

  private updateStep(step: PodiumStep, changes: Partial<PodiumStep>) {
    this.podiumSteps.update((steps) =>
      steps.map((s) => (s.placement === step.placement ? {...s, ...changes} : s)),
    );
  }
}
