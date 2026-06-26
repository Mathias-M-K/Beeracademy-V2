import {Component, input, output} from '@angular/core';
import {LobbyParticipantDTO} from '../../../../api-models/model/lobbyParticipantDTO';
import {Participant} from './participant/participant';

@Component({
  selector: 'app-participant-overview',
  templateUrl: './participant-overview.html',
  styleUrl: './participant-overview.scss',
  imports: [
    Participant
  ],
  standalone: true
})
export class ParticipantOverview {

  readonly participants = input<LobbyParticipantDTO[]>([]);
  readonly isLobbyOwner = input<boolean>(false)
  readonly addParticipant = output<string>()
  readonly removeParticipant = output<string>()

}
