import {Component, computed, input, output} from '@angular/core';
import {PartyParticipantDto} from '../../../../api-models/model/partyParticipantDto';

@Component({
  selector: 'app-existing-participant',
  imports: [],
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

  readonly connect = output<PartyParticipantDto>();
  readonly requestRelease = output<PartyParticipantDto>();

  protected readonly statusText = computed(() => {
    if (this.participant().session.isConnected) return 'Forbundet';
    if (this.participant().session.isClaimed) return 'Reserveret';
    else return 'Ledig'
  })
}
