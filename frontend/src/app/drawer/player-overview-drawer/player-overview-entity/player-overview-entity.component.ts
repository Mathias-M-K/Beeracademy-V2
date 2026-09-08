import {Component, computed, input, output, Signal} from '@angular/core';
import {Player} from '../../../services/game/models/player';
import {
  ParticipantBadge
} from '../../../pages/lobby-page/participant-overview/participant/participant-badge/participant-badge';
import {IsGameOwnerDirective} from '../../../is-game-owner.directive';

@Component({
  selector: 'app-player-overview-entity',
  styleUrl: './player-overview-entity.component.scss',
  templateUrl: './player-overview-entity.component.html',
  imports: [
    ParticipantBadge,
    IsGameOwnerDirective
  ],
  host: {
    '[class.is-requested]': 'isRequestedReleased()'
  }
})
export class PlayerOverviewEntity {

  readonly player = input.required<Player>();
  readonly isRequestedReleased = input(false);
  readonly compact = input<boolean>(false);

  readonly disconnectOrRelease = output<void>();

  protected readonly isConnected = computed(() => this.player().sessionInfo?.isConnected);
  protected readonly isClaimed = computed(() => this.player().sessionInfo?.isClaimed);

  protected readonly badgeStyle: Signal<'active' | 'local' | 'reserved'> = computed(() => {
    if (this.isConnected()) return 'active';
    if (this.isClaimed()) return 'reserved';
    return 'local';
  })
}
