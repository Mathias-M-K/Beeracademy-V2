import {Component, computed, input, output} from '@angular/core';
import {PartyParticipantDto} from '../../../../api-models/model/partyParticipantDto';
import {MaterialIcon} from '../../../common/components/material-icon/material-icon';

@Component({
  selector: 'app-existing-participant',
  imports: [
    MaterialIcon
  ],
  templateUrl: './existing-participant.html',
  styleUrl: './existing-participant.scss',
  host: {
    '[class.isFree]': '!participant().session.isClaimed',
    '[class.isReserved]': 'participant().session.isClaimed && !participant().session.isConnected',
    '[class.isConnected]': 'participant().session.isConnected',
  },
})
export class ExistingParticipant {
  readonly participant = input.required<PartyParticipantDto>();
  readonly isBeingWatched = input<boolean>(false);

  readonly connect = output<PartyParticipantDto>();
  readonly requestRelease = output<PartyParticipantDto>();
  readonly removeWatcher = output<void>();

  protected readonly statusText = computed(() => {
    if (this.isBeingWatched()) return "Afventer...";
    if (this.participant().session.isConnected) return 'Forbundet';
    if (this.participant().session.isClaimed) return 'Reserveret';
    else return 'Ledig'
  })
}
