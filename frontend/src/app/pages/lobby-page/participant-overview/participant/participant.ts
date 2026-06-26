import {Component, input, output} from '@angular/core';
import {LobbyParticipantDTO} from '../../../../../api-models/model/lobbyParticipantDTO';
import {ParticipantBadge} from './participant-badge/participant-badge';

@Component({
  selector: 'app-participant',
  templateUrl: './participant.html',
  styleUrl: './participant.scss',
  imports: [
    ParticipantBadge
  ],
  standalone: true
})
export class Participant {

  readonly participant = input.required<LobbyParticipantDTO>();
  readonly participantNameShort = input.required<string>()
  readonly canBeRemoved = input<boolean>(false);

  readonly remove = output<string>()
}
