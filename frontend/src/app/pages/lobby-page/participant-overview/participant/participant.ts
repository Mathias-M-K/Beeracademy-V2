import {Component, input, output} from '@angular/core';
import {LobbyParticipantDTO} from '../../../../../api-models/model/lobbyParticipantDTO';

@Component({
  selector: 'app-participant',
  templateUrl: './participant.html',
  styleUrl: './participant.scss',
  standalone: true
})
export class Participant {

  readonly participant = input.required<LobbyParticipantDTO>();
  readonly canBeRemoved = input<boolean>(false);

  readonly remove = output<string>()
}
