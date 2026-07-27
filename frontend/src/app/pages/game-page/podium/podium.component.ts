import {Component, computed, input} from '@angular/core';
import {ParticipantBadge} from '../../lobby-page/participant-overview/participant/participant-badge/participant-badge';
import {Player} from '../../../services/game/models/player';

@Component({
  selector: 'app-podium',
  imports: [
    ParticipantBadge
  ],
  templateUrl: './podium.component.html',
  styleUrl: './podium.component.scss',
})
export class PodiumComponent {
  readonly players = input<Player[]>();

  readonly topThreePlayers = computed(() =>
    [...(this.players() ?? [])]
      .sort((a, b) => this.bestChugTime(a) - this.bestChugTime(b))
      .filter((player)=> this.bestChugTime(player) !== Infinity)
      .slice(0, 3)
  );

  readonly chugTimes = computed(() =>
    (this.players() ?? []).flatMap((player) =>
      (player.stats?.chugs ?? []).map((chug) => ({
        name: player.name,
        chugTimeMillis: chug.chugTimeMillis,
        suit: chug.suit
      })),
    ),
  );

  private bestChugTime(player: Player): number {
    const times = player.stats?.chugs?.map((chug) => chug.chugTimeMillis ?? Infinity) ?? [];
    return times.length ? Math.min(...times) : Infinity;
  }
}
