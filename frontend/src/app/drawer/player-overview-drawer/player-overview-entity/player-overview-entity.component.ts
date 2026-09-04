import {Component, computed, input, output} from '@angular/core';
import {Player} from '../../../services/game/models/player';

@Component({
  selector: 'app-player-overview-entity',
  styleUrl: './player-overview-entity.component.scss',
  templateUrl: './player-overview-entity.component.html',
})
export class PlayerOverviewEntity {

  readonly player = input.required<Player>();
  readonly compact = input<boolean>(false);

  readonly disconnectOrRelease = output<void>();

  protected readonly isConnected = computed(() => this.player().sessionInfo?.isConnected);
  protected readonly isClaimed = computed(() => this.player().sessionInfo?.isClaimed);

  protected readonly canDrawAceText = computed(()=>{
    return this.player().canDrawChugCard ? 'Kan trække ES' : 'Kan IKKE trække ES';
  })

  protected readonly connectionStatus = computed(() => {
    if (this.player().sessionInfo?.isConnected) return 'Forbundet';
    if (this.player().sessionInfo?.isClaimed) return 'Reserveret';
    else return 'Ledig'
  });
}
