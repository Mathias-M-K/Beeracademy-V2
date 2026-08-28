import {Component, input} from '@angular/core';
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
    '[class.selectable]': '!participant().session.isClaimed',
    '[class.selected]': 'isSelected()',
  },
})
export class ExistingParticipant {
  readonly participant = input.required<PartyParticipantDto>();
  readonly isSelected = input<boolean>(false);
}
